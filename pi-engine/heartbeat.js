const { readContext, updateContext } = require('./contextReader');
const { decidePersona } = require('./decisionEngine');
const { resolveConflict, isSignificantTransition } = require('./conflictResolver');
const { executeAction } = require('./executor');
const { updateMemory } = require('./memoryManager');
const { buildConfidentContext, formatConfidenceReport } = require('./confidenceEngine');
const { getTransition, executeTransition, isCoolingDown } = require('./transitionEngine');
const { explainDecision, shortExplanation } = require('./explainEngine');

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           HEARTBEAT v2 — Core Intelligence Engine Loop           ║
 * ║                                                                  ║
 * ║  NEW in v2:                                                      ║
 * ║  ✅ Confidence-aware context building                            ║
 * ║  ✅ Predictive persona switching                                  ║
 * ║  ✅ Human-like gradual transitions                                ║
 * ║  ✅ Full explainability reports                                   ║
 * ║  ✅ Cool-down guard (anti-thrash)                                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

let heartbeatState = {
    isRunning: false,
    lastPersona: null,
    decisionCount: 0,
    startTime: null,
    cycleCount: 0,
    cyclesSinceLastSwitch: 0,
    lastDecision: null,
    errors: 0,
    lastExplanation: null,
};

/**
 * Start heartbeat loop
 * @param {number} interval - Milliseconds between cycles (default: 10s for testing)
 */
function startHeartbeat(interval = 10000) {
    if (heartbeatState.isRunning) {
        console.warn('⚠️  Heartbeat already running');
        return;
    }

    heartbeatState.isRunning = true;
    heartbeatState.startTime = new Date();

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PI ENGINE v2 STARTING');
    console.log('='.repeat(60));
    console.log(`⏱️  Heartbeat Interval: ${interval}ms (${(interval / 1000).toFixed(1)}s)`);
    console.log(`📅 Started: ${heartbeatState.startTime.toLocaleString()}`);
    console.log('🔮 Predictive Intelligence: ENABLED');
    console.log('📡 Confidence System: ENABLED');
    console.log('🔄 Transition Engine: ENABLED');
    console.log('🧠 Explainability: ENABLED');
    console.log('='.repeat(60) + '\n');

    const heartbeatInterval = setInterval(async () => {
        try {
            await performHeartbeatCycle();
        } catch (err) {
            heartbeatState.errors++;
            console.error(`\n❌ HEARTBEAT ERROR (${heartbeatState.errors}):`, err.message);
            console.error('Stack:', err.stack);
        }
    }, interval);

    heartbeatState.intervalId = heartbeatInterval;
    console.log('✅ Heartbeat running in background\n');
}

/**
 * Single heartbeat cycle — upgraded pipeline
 */
async function performHeartbeatCycle() {
    heartbeatState.cycleCount++;
    heartbeatState.cyclesSinceLastSwitch++;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🔁 CYCLE #${heartbeatState.cycleCount}`);
    console.log(`⏰ ${new Date().toLocaleTimeString()}`);
    console.log(`${'─'.repeat(60)}`);

    // ── STEP 1: READ RAW CONTEXT ──────────────────────────────────
    console.log('\n[1/6] Reading context...');
    const rawContext = await readContext();

    // ── STEP 2: BUILD CONFIDENT CONTEXT ──────────────────────────
    console.log('\n[2/6] Building confidence-annotated context...');
    const confidentContext = buildConfidentContext(rawContext);
    console.log(formatConfidenceReport(confidentContext));

    // ── STEP 3: MAKE DECISIONS (predictive + reactive + AI) ───────
    console.log('\n[3/6] Making persona decisions...');
    const personaCandidates = await decidePersona(rawContext, confidentContext);

    // ── STEP 4: RESOLVE CONFLICT ──────────────────────────────────
    console.log('\n[4/6] Resolving conflicts...');
    const finalPersona = resolveConflict(personaCandidates);

    // ── STEP 5: TRANSITION INTELLIGENCE ──────────────────────────
    console.log('\n[5/6] Evaluating transition...');
    const isTransition = isSignificantTransition(heartbeatState.lastPersona, finalPersona);

    // Cool-down guard: don't thrash if we just switched
    if (isTransition && isCoolingDown(heartbeatState.lastPersona, heartbeatState.cyclesSinceLastSwitch)) {
        console.log(`   🛡️  COOL-DOWN ACTIVE — staying with "${heartbeatState.lastPersona}" (too soon to switch again)`);
    } else if (isTransition) {
        const from = heartbeatState.lastPersona || 'none';
        console.log(`   🔄 Transition: "${from}" → "${finalPersona}"`);

        // Get the transition plan
        const transition = getTransition(from, finalPersona);

        // ── STEP 6: EXPLAINABILITY REPORT ─────────────────────────
        console.log('\n[6/6] Generating explanation...');
        const winner = personaCandidates.find(c => c.persona === finalPersona);
        const isPredictive = winner?.predictive || false;

        const explanation = explainDecision({
            selectedPersona: finalPersona,
            candidates: personaCandidates,
            rawContext,
            confidentContext,
            previousPersona: heartbeatState.lastPersona,
            transition,
            isPredictive,
        });

        heartbeatState.lastExplanation = explanation;

        // Execute the transition (gradual / instant / guided)
        await executeTransition(transition);

        // Execute the actual persona action
        const executionResult = await executeAction(finalPersona);

        if (executionResult.success) {
            const prevPersona = heartbeatState.lastPersona;
            heartbeatState.lastPersona = finalPersona;
            heartbeatState.decisionCount++;
            heartbeatState.cyclesSinceLastSwitch = 0;

            // Update memory with short explanation
            const shortReason = shortExplanation(finalPersona, winner);
            updateMemory(rawContext, finalPersona, { ...winner, shortReason });

            heartbeatState.lastDecision = {
                timestamp: new Date(),
                persona: finalPersona,
                previousPersona: prevPersona,
                context: rawContext,
                isPredictive,
                transition: transition.key,
                success: true,
            };
        }
    } else {
        console.log(`   ✓ No significant transition (staying with "${finalPersona}")`);
    }

    // Print summary
    printCycleSummary();
}

/**
 * Print heartbeat cycle summary
 */
function printCycleSummary() {
    const uptime = Math.round((new Date() - heartbeatState.startTime) / 1000);
    const uptimeStr = formatUptime(uptime);
    const lastSwitch = heartbeatState.lastDecision
        ? new Date(heartbeatState.lastDecision.timestamp).toLocaleTimeString()
        : 'never';

    console.log(`\n${'─'.repeat(60)}`);
    console.log('📊 CYCLE SUMMARY');
    console.log(`   Current Persona : ${heartbeatState.lastPersona || 'none'}`);
    console.log(`   Last Switch     : ${lastSwitch}`);
    console.log(`   Total Decisions : ${heartbeatState.decisionCount}`);
    console.log(`   Total Cycles    : ${heartbeatState.cycleCount}`);
    console.log(`   Uptime          : ${uptimeStr}`);
    console.log(`   Errors          : ${heartbeatState.errors}`);
    console.log(`${'─'.repeat(60)}\n`);
}

function stopHeartbeat() {
    if (!heartbeatState.isRunning) {
        console.warn('⚠️  Heartbeat not running');
        return;
    }

    clearInterval(heartbeatState.intervalId);
    heartbeatState.isRunning = false;

    const uptime = Math.round((new Date() - heartbeatState.startTime) / 1000);
    const uptimeStr = formatUptime(uptime);

    console.log('\n' + '='.repeat(60));
    console.log('🛑 PI ENGINE STOPPED');
    console.log('='.repeat(60));
    console.log(`⏸️  Total Uptime    : ${uptimeStr}`);
    console.log(`🔀 Total Cycles    : ${heartbeatState.cycleCount}`);
    console.log(`🎯 Total Decisions : ${heartbeatState.decisionCount}`);
    console.log(`❌ Total Errors    : ${heartbeatState.errors}`);
    console.log('='.repeat(60) + '\n');
}

function getHeartbeatStatus() {
    return {
        ...heartbeatState,
        uptime: new Date() - heartbeatState.startTime,
        lastDecisionTime: heartbeatState.lastDecision?.timestamp,
    };
}

function pauseHeartbeat() {
    if (!heartbeatState.isRunning) {
        console.warn('⚠️  Heartbeat not running');
        return;
    }
    clearInterval(heartbeatState.intervalId);
    console.log('⏸️  Heartbeat paused');
}

function resumeHeartbeat(interval = 10000) {
    if (heartbeatState.isRunning) {
        console.warn('⚠️  Heartbeat already running');
        return;
    }
    heartbeatState.isRunning = true;
    const heartbeatInterval = setInterval(async () => {
        try {
            await performHeartbeatCycle();
        } catch (err) {
            heartbeatState.errors++;
            console.error('❌ Heartbeat error:', err.message);
        }
    }, interval);
    heartbeatState.intervalId = heartbeatInterval;
    console.log('▶️  Heartbeat resumed');
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

module.exports = {
    startHeartbeat,
    stopHeartbeat,
    pauseHeartbeat,
    resumeHeartbeat,
    performHeartbeatCycle,
    getHeartbeatStatus,
    heartbeatState,
};
