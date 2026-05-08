/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                 API WRAPPER — Plug & Play M1 Node                ║
 * ║  Serves endpoints for M2, M3, and M4 to connect to the brain     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const { updateContext, readContext } = require('./contextReader');
const { validateContext, validateDecisionOutput } = require('./validation');
const { getHeartbeatStatus, performHeartbeatCycle, heartbeatState } = require('./heartbeat');

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️ SYSTEM CONFIG & FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

// Simulators
const USE_M3_SIM = process.env.USE_M3_SIM === 'true';
const USE_M2_SIM = process.env.USE_M2_SIM === 'true';
const USE_M4_SIM = process.env.USE_M4_SIM === 'true';

// Demo Lock
const DEMO_LOCK = process.env.DEMO_LOCK === 'true';
const DEMO_SCENE = parseInt(process.env.DEMO_SCENE) || 1;

// Record / Replay
const RECORD_MODE = process.env.RECORD_MODE === 'true';
const REPLAY_MODE = process.env.REPLAY_MODE === 'true';
const ENABLE_M4_PUSH = process.env.ENABLE_M4_PUSH === 'true';
const M4_API_URL = (process.env.M4_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const M4_API_TIMEOUT_MS = parseInt(process.env.M4_API_TIMEOUT_MS || '2000', 10);

// Rate Limiting & Loop Control State
const rateLimit = { lastContextUpdate: 0, lastOverride: 0 };
const CONTEXT_DEBOUNCE_MS = 2000;
const OVERRIDE_COOLDOWN_MS = 5000;

// Health & Metrics
const metrics = { startTime: Date.now(), errorsLast5Min: 0, m2LastAck: null, m3LastUpdate: null };

async function tryNotifyM4Decision(decisionPayload) {
    if (!ENABLE_M4_PUSH || USE_M4_SIM) {
        return;
    }

    try {
        await axios.post(
            `${M4_API_URL}/decision`,
            decisionPayload,
            {
                timeout: M4_API_TIMEOUT_MS,
                headers: {
                    'x-api-token': process.env.M3_API_TOKEN || ''
                }
            }
        );
        console.log('✅ [M4] Decision pushed successfully');
    } catch (err) {
        const detail = err.response?.status ? `status ${err.response.status}` : err.message;
        console.warn(`⚠️  [M4] Push failed (${detail}) — continuing without M4`);
    }
}

async function handleUserOverride(req, res) {
    const { persona, selected_persona, command } = req.body;
    const requestedPersona = persona || selected_persona;
    const targetPersona = command === 'pause' || requestedPersona === 'PAUSE'
        ? 'sleep'
        : requestedPersona;

    if (!targetPersona) {
        return res.status(400).json({ error: 'persona is required' });
    }

    if (DEMO_LOCK && DEMO_SCENE !== 3) {
        return res.status(403).json({ error: 'Overrides locked in current demo scene' });
    }

    const now = Date.now();
    if (now - rateLimit.lastOverride < OVERRIDE_COOLDOWN_MS) {
        return res.status(429).json({ error: 'Override cooldown active.' });
    }

    console.log(`\n🚨 [M4] USER OVERRIDE REQUESTED: Switch to -> ${targetPersona}`);
    if (USE_M4_SIM) console.log(`🤖 [M4 SIM] Telegram message logged: User overrode to ${targetPersona}`);

    heartbeatState.manualOverride = {
        active: true,
        persona: targetPersona,
        setAt: new Date().toISOString(),
        expiresAfterCycles: 2
    };

    rateLimit.lastOverride = now;
    if (RECORD_MODE) recordStream('override', { persona: targetPersona, command });

    await performHeartbeatCycle();
    return res.json({ success: true, message: `Overridden to ${targetPersona}`, decision: generateStandardOutputContract() });
}

// ─────────────────────────────────────────────────────────────────────────────
// 📡 M3 ENDPOINT: Context Update
// ─────────────────────────────────────────────────────────────────────────────
app.post('/context', async (req, res) => {
    if (DEMO_LOCK || REPLAY_MODE) {
        console.log(`🔒 [M3] Context ignored (DEMO_LOCK or REPLAY_MODE active)`);
        return res.json({ success: true, message: 'Ignored by override' });
    }

    const now = Date.now();
    if (now - rateLimit.lastContextUpdate < CONTEXT_DEBOUNCE_MS) {
        console.log('⏳ [M3] Context update debounced (rate limited)');
        return res.status(429).json({ error: 'Too many updates. Please wait.' });
    }

    try {
        console.log(`\n📥 [M3] Context received:`, req.body);
        const validatedContext = validateContext(req.body);
        
        updateContext(validatedContext);
        rateLimit.lastContextUpdate = now;
        metrics.m3LastUpdate = now;

        if (RECORD_MODE) recordStream('context', validatedContext);

        res.json({ success: true, message: 'Context updated successfully', context: validatedContext });
    } catch (err) {
        metrics.errorsLast5Min++;
        console.error('❌ [M3] Error processing context:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 M1 ENDPOINT: Trigger & Get Decision
// ─────────────────────────────────────────────────────────────────────────────
app.post('/decision', async (req, res) => {
    console.log(`\n⚡ [M1] Forced decision cycle requested`);
    try {
        if (DEMO_LOCK || REPLAY_MODE) {
            // Provide canned output for demo stability
            console.log(`🎬 [M1] Serving DEMO SCENE ${DEMO_SCENE} decision`);
            return res.json(getDemoDecision(DEMO_SCENE));
        }

        if (USE_M3_SIM) {
            console.log(`🤖 [M3 SIM] Injecting simulated context...`);
            updateContext(getSimulatedContext());
        }

        // Run cycle
        await performHeartbeatCycle();
        const output = generateStandardOutputContract();
        const validatedOutput = validateDecisionOutput(output);
        
        console.log(`✅ [M1] Decision made: ${validatedOutput.persona}`);
        if (RECORD_MODE) recordStream('decision', validatedOutput);

        void tryNotifyM4Decision(validatedOutput);

        if (USE_M2_SIM) console.log(`🤖 [M2 SIM] Executing actions: ${validatedOutput.actions.join(', ')}`);
        
        // Setup timeout for M2 ACK if needed
        setTimeout(() => checkM2Ack(validatedOutput.timestamp), 3000);

        res.json(validatedOutput);
    } catch (err) {
        metrics.errorsLast5Min++;
        console.error('❌ [M1] Error during decision cycle:', err.message);
        console.log('🛡️ [M1] FALLBACK MODE: Returning default decision');
        res.json(getFallbackDecision());
    }
});

app.get('/decision', (req, res) => {
    try {
        if (DEMO_LOCK || REPLAY_MODE) return res.json(getDemoDecision(DEMO_SCENE));
        const output = generateStandardOutputContract();
        res.json(validateDecisionOutput(output));
    } catch (err) {
        res.json(getFallbackDecision());
    }
});

app.get('/decision/latest', (req, res) => {
    try {
        if (DEMO_LOCK || REPLAY_MODE) return res.json(getDemoDecision(DEMO_SCENE));
        const output = generateStandardOutputContract();
        res.json(validateDecisionOutput(output));
    } catch (err) {
        res.json(getFallbackDecision());
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ✅ M2 ENDPOINT: Action Acknowledgement
// ─────────────────────────────────────────────────────────────────────────────
app.post('/ack', (req, res) => {
    const { ack, actions_executed, errors } = req.body;
    metrics.m2LastAck = Date.now();
    console.log(`\n👍 [M2] Actions Acknowledged: ${actions_executed?.join(', ')}`);
    if (errors && errors.length > 0) {
        console.warn(`⚠️ [M2] Action Errors: ${errors.join(', ')}`);
    }
    res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// 🎮 M4 ENDPOINT: User Override
// ─────────────────────────────────────────────────────────────────────────────
app.post('/override', handleUserOverride);
app.post('/persona-decision', handleUserOverride);

// ─────────────────────────────────────────────────────────────────────────────
// 🏥 HEALTH DASHBOARD ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    const status = getHeartbeatStatus();
    const uptimeSec = Math.floor((Date.now() - metrics.startTime) / 1000);
    
    // Evaluate module statuses based on simulated flags and timeouts
    const getM2Status = () => USE_M2_SIM ? 'simulated' : ((Date.now() - (metrics.m2LastAck || 0)) < 60000 ? 'connected' : 'degraded');
    const getM3Status = () => USE_M3_SIM ? 'simulated' : ((Date.now() - (metrics.m3LastUpdate || 0)) < 30000 ? 'connected' : 'degraded');
    const getM4Status = () => USE_M4_SIM ? 'simulated' : 'connected'; // Harder to track passive UX

    res.json({
        uptime: `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`,
        currentPersona: status.lastPersona || 'default',
        lastDecisionAt: status.lastDecision?.timestamp || null,
        modules: {
            M1: 'healthy',
            M2: getM2Status(),
            M3: getM3Status(),
            M4: getM4Status()
        },
        errors_last_5min: metrics.errorsLast5Min,
        flags: {
            DEMO_LOCK,
            DEMO_SCENE,
            STRICT_CONTRACT: process.env.STRICT_CONTRACT === 'true',
            RECORD_MODE,
            REPLAY_MODE
        }
    });

    // Reset error counter every 5 min (simplified)
    if (Date.now() - metrics.startTime > 300000) metrics.errorsLast5Min = 0;
});

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️ HELPERS & FALLBACKS
// ─────────────────────────────────────────────────────────────────────────────

function checkM2Ack(decisionTimestamp) {
    // If M2 hasn't sent an ACK in the last 3s, log a timeout
    if (!USE_M2_SIM && (!metrics.m2LastAck || metrics.m2LastAck < new Date(decisionTimestamp).getTime())) {
        console.warn(`⚠️ [M2] TIMEOUT: No acknowledgement received for decision ${decisionTimestamp}`);
        metrics.errorsLast5Min++;
    }
}

function recordStream(type, data) {
    const entry = { timestamp: new Date().toISOString(), type, data };
    fs.appendFileSync('./replay_stream.jsonl', JSON.stringify(entry) + '\n');
}

function generateStandardOutputContract() {
    if (!heartbeatState.lastDecision) throw new Error('No decisions made yet');
    const dec = heartbeatState.lastDecision;
    return {
        persona: dec.persona,
        confidence: 0.95,
        is_predictive: dec.isPredictive || false,
        transition: { type: "instant", from: dec.previousPersona || "none", to: dec.persona, steps: [], message: `Switched to ${dec.persona}` },
        actions: getActionsForPersona(dec.persona),
        reason: 'Heartbeat cycle',
        explanation: { top_signals: [], decision_source: 'hybrid_engine', full_report: 'No report' },
        requires_user_input: false,
        conflict: null,
        state: { current_persona: dec.persona, previous_persona: dec.previousPersona, last_switch_time: dec.timestamp, in_cooldown: false, mode_duration_minutes: 0 },
        timestamp: dec.timestamp
    };
}

function getActionsForPersona(persona) {
    const map = {
        work: ["enable_dnd", "open_calendar", "mute_social_apps", "set_brightness_high"],
        fitness: ["open_fitness_app", "enable_screen_on", "disable_dnd", "start_activity_track"],
        calm: ["reduce_notifications", "set_brightness_low", "enable_night_mode", "open_meditation_app"],
        sleep: ["silence_all", "enable_night_filter", "set_brightness_min", "enable_night_mode"],
        default: ["disable_dnd"]
    };
    return map[persona] || map.default;
}

function getFallbackDecision() {
    return {
        persona: "default", confidence: 1.0, is_predictive: false,
        transition: { type: "instant", from: "none", to: "default", steps: [], message: "Fallback mode active" },
        actions: getActionsForPersona("default"), reason: "System failure - Fallback engaged",
        explanation: { top_signals: [], decision_source: "fallback", full_report: "System failure fallback" },
        requires_user_input: false, conflict: null,
        state: { current_persona: "default", previous_persona: "none", last_switch_time: new Date().toISOString(), in_cooldown: false, mode_duration_minutes: 0 },
        timestamp: new Date().toISOString()
    };
}

function getDemoDecision(sceneId) {
    // Returns pre-baked scenes for the perfect demo flow
    const scenarios = {
        1: { persona: 'productivity', reason: 'Morning routine detected' },
        2: { persona: 'work', is_predictive: true, reason: 'Predicting meeting in 15 mins' },
        3: { persona: null, requires_user_input: true, conflict: { message: "Gym and meeting overlap", options: ["work", "fitness"] } },
        4: { persona: 'fitness', reason: 'User selected Gym mode' }
    };
    const base = getFallbackDecision();
    const scene = scenarios[sceneId] || scenarios[1];
    return { ...base, ...scene, timestamp: new Date().toISOString() };
}

function getSimulatedContext() {
    return { location: "simulated_office", calendar_event: "Simulated Meeting", stress: 0.5, battery: 90, notifications: 1, activity: "working" };
}

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n` + `═`.repeat(60));
    console.log(`🌐 API WRAPPER / MOCK SERVER IS RUNNING`);
    console.log(`═`.repeat(60));
    console.log(`   📡 Port: ${PORT}`);
    console.log(`   🔗 GET    /health    — Health Dashboard`);
    console.log(`   🔗 POST   /decision  — Trigger & fetch actions`);
    console.log(`   🔗 POST   /context   — Send sensor data`);
    console.log(`   🔗 POST   /override  — Send user input`);
    console.log(`   🔗 POST   /ack       — M2 Action acknowledgement`);
    console.log(`═`.repeat(60) + `\n`);
    
    if (DEMO_LOCK) console.log(`🔒 DEMO_LOCK: ENABLED (Scene ${DEMO_SCENE})`);
    if (process.env.STRICT_CONTRACT === 'true') console.log(`🛑 STRICT_CONTRACT: ENABLED (Will reject bad data)`);
    if (RECORD_MODE) console.log(`⏺️ RECORD_MODE: ENABLED`);
    if (REPLAY_MODE) console.log(`▶️ REPLAY_MODE: ENABLED`);
    if (!ENABLE_M4_PUSH) console.log(`📴 M4 live push: DISABLED (M1+M3 only mode)`);
    if (ENABLE_M4_PUSH && !USE_M4_SIM) console.log(`📡 M4 live push: ENABLED -> ${M4_API_URL}`);
    
    console.log(`\n🛡️  Fallback Failsafe Mode: ALWAYS ACTIVE\n`);
});

module.exports = app;
