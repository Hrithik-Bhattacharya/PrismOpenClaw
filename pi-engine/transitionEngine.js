/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           TRANSITION ENGINE - Human-Like Persona Switching       ║
 * ║  Prevents jarring hard-cuts between personas by defining         ║
 * ║  transition paths, cool-down periods, and intermediate steps.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/**
 * Transition type definitions.
 *
 *  instant     – switch immediately (same-family moves)
 *  gradual     – multi-step wind-down → ramp-up
 *  protective  – only switch if condition persists (avoids thrashing)
 *  guided      – send a suggestion to user before committing
 */

const TRANSITION_MAP = {
    // ── WORK FAMILY ────────────────────────────────────────────────
    'work→calm':           { type: 'gradual',    steps: ['reduce_notifications', 'breathing_prompt', 'full_calm'],   message: '🧘 Wrapping up — switching to Calm mode shortly.' },
    'work→relaxation':     { type: 'gradual',    steps: ['mute_work_alerts', 'dim_screen', 'full_relax'],            message: '😌 Work done. Relaxation mode activating…' },
    'work→sleep':          { type: 'gradual',    steps: ['close_work_apps', 'night_mode', 'silence_all'],            message: '😴 Heading into sleep mode. Good night!' },
    'work→fitness':        { type: 'instant',    steps: [],                                                          message: '💪 Gym time! Switching to Fitness mode.' },
    'work→productivity':   { type: 'instant',    steps: [],                                                          message: '⚡ Staying in productive flow.' },
    'work→focus':          { type: 'instant',    steps: [],                                                          message: '🎯 Deep focus activated.' },

    // ── REST / CALM FAMILY ─────────────────────────────────────────
    'calm→work':           { type: 'guided',     steps: ['gentle_alert', 'prepare_work_apps'],                      message: '💼 Meeting coming up — switching to Work mode.' },
    'calm→focus':          { type: 'guided',     steps: ['gentle_alert', 'block_distractions'],                     message: '🎯 Focus session starting.' },
    'calm→productivity':   { type: 'gradual',    steps: ['increase_brightness', 'work_playlist'],                   message: '⚡ Ramping up productivity.' },
    'relaxation→work':     { type: 'guided',     steps: ['gentle_alert', 'prepare_calendar'],                       message: '💼 Back to work — hang on.' },

    // ── SLEEP FAMILY ───────────────────────────────────────────────
    'sleep→work':          { type: 'gradual',    steps: ['gradual_brightness', 'morning_briefing', 'work_mode'],    message: '🌅 Good morning! Loading your Work profile.' },
    'sleep→fitness':       { type: 'gradual',    steps: ['gradual_brightness', 'workout_warmup'],                   message: '🌅 Morning workout mode — let\'s go!' },
    'sleep→default':       { type: 'gradual',    steps: ['gradual_brightness', 'morning_summary'],                  message: '🌅 Good morning! Starting your day.' },

    // ── FITNESS FAMILY ─────────────────────────────────────────────
    'fitness→work':        { type: 'protective', steps: ['cooldown_period', 'switch_to_work'],                      message: '💼 Workout done — loading Work mode.' },
    'fitness→calm':        { type: 'gradual',    steps: ['cooldown_music', 'breathing_exercises'],                  message: '🧘 Cool-down time. Switching to Calm.' },
    'fitness→relaxation':  { type: 'gradual',    steps: ['cooldown_period', 'shower_reminder', 'relax_mode'],       message: '😌 Great workout! Time to relax.' },

    // ── SOCIAL FAMILY ──────────────────────────────────────────────
    'social→focus':        { type: 'guided',     steps: ['mute_social', 'focus_mode'],                              message: '🎯 Silencing socials. Focus time.' },
    'social→work':         { type: 'guided',     steps: ['mute_social', 'open_calendar'],                           message: '💼 Heading back to work.' },

    // ── DEFAULT FALLBACK ───────────────────────────────────────────
    'default':             { type: 'instant',    steps: [],                                                          message: '🔄 Persona updated.' },
};

/**
 * Minimum cycle gap (in heartbeat ticks) before re-switching to the
 * same persona. Prevents rapid oscillation.
 */
const COOL_DOWN_CYCLES = {
    sleep:       3,   // Don't leave sleep immediately
    fitness:     2,   // Give workout time to establish
    calm:        2,
    default:     1,
};

/** Internal tracker for cool-down enforcement */
const _coolDownTracker = {};

/**
 * Get the transition plan for going from one persona to another.
 *
 * @param {string} fromPersona
 * @param {string} toPersona
 * @returns {object} transition plan
 */
function getTransition(fromPersona, toPersona) {
    const key = `${fromPersona}→${toPersona}`;
    const plan = TRANSITION_MAP[key] || TRANSITION_MAP['default'];

    return {
        key,
        from: fromPersona,
        to: toPersona,
        ...plan,
    };
}

/**
 * Determine whether a switch should be BLOCKED due to cool-down.
 *
 * @param {string} fromPersona
 * @param {number} cyclesSinceLast  - How many heartbeat cycles since last switch
 * @returns {boolean}
 */
function isCoolingDown(fromPersona, cyclesSinceLast) {
    const required = COOL_DOWN_CYCLES[fromPersona] || 0;
    return cyclesSinceLast < required;
}

/**
 * Log and execute transition steps (mock — later hooks into M2/M4).
 *
 * @param {object} transition  - From getTransition()
 * @returns {Promise<void>}
 */
async function executeTransition(transition) {
    console.log(`\n🔄 TRANSITION ENGINE: ${transition.from} → ${transition.to}`);
    console.log(`   Type: ${transition.type.toUpperCase()}`);
    console.log(`   Message: "${transition.message}"`);

    if (transition.steps && transition.steps.length > 0) {
        console.log('   Steps:');
        for (const step of transition.steps) {
            console.log(`      ↳ ${step}...`);
            // TODO: Hook into M4 (Telegram) for user-facing steps
            // TODO: Hook into M2 (ADB) for device-side steps
            await _simulateStep(step);
        }
    }

    console.log(`   ✅ Transition complete → ${transition.to}`);
}

/**
 * Simulate a single transition step (placeholder for M2/M4 integration).
 */
async function _simulateStep(stepName) {
    // Gradual steps take slightly longer to feel deliberate
    const delay = stepName.includes('gradual') || stepName.includes('cooldown') ? 300 : 100;
    await new Promise(r => setTimeout(r, delay));
}

/**
 * Human-readable summary of a transition, used in explainability output.
 *
 * @param {object} transition
 * @returns {string}
 */
function describeTransition(transition) {
    const typeLabels = {
        instant:    '⚡ Instant switch',
        gradual:    '🌊 Gradual transition',
        protective: '🛡️  Protected switch (cool-down enforced)',
        guided:     '💬 Guided switch (user notified first)',
    };
    const label = typeLabels[transition.type] || '🔄 Switch';
    const stepCount = transition.steps?.length || 0;
    return `${label} — ${stepCount} intermediate step(s)`;
}

module.exports = {
    getTransition,
    executeTransition,
    isCoolingDown,
    describeTransition,
    TRANSITION_MAP,
    COOL_DOWN_CYCLES,
};
