#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              🎬 PI ENGINE — DEMO MODE                            ║
 * ║                                                                  ║
 * ║  Simulates a full realistic day to showcase ALL system features  ║
 * ║  Run: node demo.js                                               ║
 * ║  Run: node demo.js --fast     (2s between scenes, not 5s)        ║
 * ║  Run: node demo.js --scene 3  (start from a specific scene)      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  DEMO FLOW:
 *  Scene 1  — 🌅 Morning Wakeup        (sleep → productivity)
 *  Scene 2  — 🔮 Predictive Meeting     (upcoming event → work EARLY)
 *  Scene 3  — 📅 Active Meeting         (calendar event → work)
 *  Scene 4  — 💪 Gym Session            (location:gym → fitness)
 *  Scene 5  — 😰 Stress Spike           (high stress → calm)
 *  Scene 6  — 🔋 Low Battery Emergency  (battery:15 → power_saver)
 *  Scene 7  — 📵 Notification Overload  (10 notifs → focus)
 *  Scene 8  — 🌙 Night Winding Down     (late hour → sleep)
 */

require('dotenv').config();

const { readContext, updateContext } = require('./contextReader');
const { decidePersona }             = require('./decisionEngine');
const { resolveConflict }           = require('./conflictResolver');
const { executeAction }             = require('./executor');
const { buildConfidentContext,
        formatConfidenceReport }    = require('./confidenceEngine');
const { getTransition,
        executeTransition }         = require('./transitionEngine');
const { explainDecision }           = require('./explainEngine');
const { updateMemory }              = require('./memoryManager');

// ─────────────────────────────────────────────────────────────────────────────
// CLI ARGS
// ─────────────────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const isFast      = args.includes('--fast');
const sceneArgIdx = args.indexOf('--scene');
const startScene  = sceneArgIdx !== -1 ? parseInt(args[sceneArgIdx + 1], 10) - 1 : 0;

const SCENE_DELAY = isFast ? 2000 : 5000;

// ─────────────────────────────────────────────────────────────────────────────
// DEMO SCENES
// Each scene: { name, emoji, description, context }
// ─────────────────────────────────────────────────────────────────────────────
const SCENES = [
    {
        name: 'Morning Wakeup',
        emoji: '🌅',
        description: 'User just woke up. Stress is low, battery charged, no meetings yet.',
        context: {
            location: 'home',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.2,
            battery: 95,
            notifications: 2,
            activity: 'waking_up',
            simulated_hour: 7,
        },
    },
    {
        name: 'Predictive Meeting (30 min away)',
        emoji: '🔮',
        description: 'Meeting is 30 min away. System detects it and starts PRODUCTIVITY mode — user doesn\'t even know it\'s coming.',
        context: {
            location: 'home',
            calendar_event: 'none',
            upcoming_event: 'Daily Standup',
            time_to_event: 30,
            stress: 0.3,
            battery: 90,
            notifications: 1,
            activity: 'light_work',
            simulated_hour: 9,
        },
    },
    {
        name: 'Critical Predictive Switch (10 min away)',
        emoji: '🔮⚡',
        description: 'Meeting is NOW 10 minutes away. System switches to WORK mode proactively.',
        context: {
            location: 'office',
            calendar_event: 'none',
            upcoming_event: 'Daily Standup',
            time_to_event: 10,
            stress: 0.4,
            battery: 88,
            notifications: 3,
            activity: 'preparing',
            simulated_hour: 9,
        },
    },
    {
        name: 'Active Meeting',
        emoji: '📅',
        description: 'Calendar event is active. System confirms WORK mode with high confidence.',
        context: {
            location: 'office',
            calendar_event: 'Daily Standup',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.5,
            battery: 85,
            notifications: 0,
            activity: 'in_meeting',
            simulated_hour: 10,
        },
    },
    {
        name: 'Gym Session',
        emoji: '💪',
        description: 'User drove to gym. GPS detects location change. System auto-switches to FITNESS.',
        context: {
            location: 'gym',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.3,
            battery: 75,
            notifications: 4,
            activity: 'exercising',
            simulated_hour: 12,
        },
    },
    {
        name: 'Stress Spike',
        emoji: '😰',
        description: 'Wearable detects elevated cortisol / heart rate. System switches to CALM proactively.',
        context: {
            location: 'office',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.85,
            battery: 65,
            notifications: 8,
            activity: 'stressed_at_desk',
            simulated_hour: 15,
        },
    },
    {
        name: 'Low Battery Emergency',
        emoji: '🔋',
        description: 'Battery drops to 15%. System overrides current persona and enters POWER_SAVER.',
        context: {
            location: 'commute',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.4,
            battery: 15,
            notifications: 2,
            activity: 'commuting',
            simulated_hour: 18,
        },
    },
    {
        name: 'Notification Overload',
        emoji: '📵',
        description: '10 unread notifications pile up. System switches to DEEP FOCUS — stops the noise.',
        context: {
            location: 'home',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.6,
            battery: 55,
            notifications: 10,
            activity: 'distracted',
            simulated_hour: 20,
        },
    },
    {
        name: 'Night Wind-Down',
        emoji: '🌙',
        description: 'It\'s 22:30. System gracefully transitions to SLEEP mode with gradual steps.',
        context: {
            location: 'home',
            calendar_event: 'none',
            upcoming_event: null,
            time_to_event: null,
            stress: 0.15,
            battery: 45,
            notifications: 0,
            activity: 'relaxing',
            simulated_hour: 22,
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO RUNNER
// ─────────────────────────────────────────────────────────────────────────────

let previousPersona = null;

async function runScene(scene, index) {
    const sceneNum = index + 1;

    console.log('\n' + '═'.repeat(68));
    console.log(`   ${scene.emoji}  SCENE ${sceneNum}/${SCENES.length} — ${scene.name.toUpperCase()}`);
    console.log('═'.repeat(68));
    console.log(`   📖 ${scene.description}`);
    console.log('═'.repeat(68));

    // Write scene context to context.json
    updateContext(scene.context);

    // Build confidence-annotated context
    const rawContext     = scene.context;
    const confidentCtx   = buildConfidentContext(rawContext);

    // Show confidence report
    console.log(formatConfidenceReport(confidentCtx));

    // Decide
    const candidates   = await decidePersona(rawContext, confidentCtx);
    const finalPersona = resolveConflict(candidates);
    const winner       = candidates.find(c => c.persona === finalPersona);
    const isPredictive = winner?.predictive || false;

    // Transition
    const transition = getTransition(previousPersona || 'default', finalPersona);

    // Explain
    explainDecision({
        selectedPersona: finalPersona,
        candidates,
        rawContext,
        confidentContext: confidentCtx,
        previousPersona,
        transition,
        isPredictive,
    });

    // Execute transition (gradual / instant / guided)
    await executeTransition(transition);

    // Execute action
    await executeAction(finalPersona);

    // Log to memory
    updateMemory(rawContext, finalPersona, winner);

    previousPersona = finalPersona;

    console.log(`\n✅ Scene ${sceneNum} complete. Active persona: ${finalPersona.toUpperCase()}\n`);
}

async function runDemo() {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║             🎬 PI ENGINE — FULL SYSTEM DEMO                      ║
║                                                                  ║
║  This demo simulates a full day to showcase:                     ║
║  🔮  Predictive switching (acts BEFORE events happen)            ║
║  📡  Confidence system (uncertain signals penalized)             ║
║  🔄  Human-like transitions (gradual, guided, protected)         ║
║  🧠  Explainable AI (clear WHY for every decision)               ║
║                                                                  ║
║  Scenes: ${SCENES.length}   |   Delay: ${(SCENE_DELAY / 1000).toFixed(0)}s between scenes${isFast ? '  (FAST MODE)' : '             '}║
╚══════════════════════════════════════════════════════════════════╝
`);

    await sleep(1000);

    const scenesToRun = SCENES.slice(startScene);

    for (let i = 0; i < scenesToRun.length; i++) {
        await runScene(scenesToRun[i], startScene + i);

        if (i < scenesToRun.length - 1) {
            console.log(`\n⏳ Next scene in ${SCENE_DELAY / 1000}s...\n`);
            await sleep(SCENE_DELAY);
        }
    }

    // ── FINAL SUMMARY ──────────────────────────────────────────────
    console.log('\n' + '═'.repeat(68));
    console.log('🏆  DEMO COMPLETE — FULL DAY SIMULATION SUMMARY');
    console.log('═'.repeat(68));
    console.log(`   Total Scenes    : ${scenesToRun.length}`);
    console.log(`   Final Persona   : ${previousPersona?.toUpperCase() || 'none'}`);
    console.log('');
    console.log('   What was demonstrated:');
    console.log('   ✅ Predictive intelligence — switched BEFORE meeting started');
    console.log('   ✅ Context confidence      — uncertain signals penalized');
    console.log('   ✅ Transition intelligence — gradual human-like switches');
    console.log('   ✅ Explainable AI          — every decision fully explained');
    console.log('   ✅ Stress detection        — calm mode triggered by wearable');
    console.log('   ✅ Battery override         — power_saver at critical level');
    console.log('   ✅ Focus on overload        — silenced notification storm');
    console.log('   ✅ Sleep mode              — graceful night wind-down');
    console.log('');
    console.log('   This system knows what you need — before you do.');
    console.log('═'.repeat(68) + '\n');

    // Restore neutral context
    updateContext({
        location: 'home',
        calendar_event: 'none',
        upcoming_event: null,
        time_to_event: null,
        stress: 0.3,
        battery: 85,
        notifications: 2,
        activity: 'idle',
    });

    console.log('🔄 Context restored to neutral defaults.\n');
    process.exit(0);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRYPOINT
// ─────────────────────────────────────────────────────────────────────────────
runDemo().catch(err => {
    console.error('\n❌ DEMO FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
});
