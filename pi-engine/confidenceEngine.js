/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              CONFIDENCE ENGINE - Signal Trust Scoring            ║
 * ║   Assigns confidence to each context signal before decisions     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Each raw context signal gets a confidence value [0.0 – 1.0].
 * Decision scores are then multiplied by their signals' confidence,
 * so uncertain data can't silently derail the persona selection.
 */

/**
 * Base confidence values per signal source.
 * These reflect how reliable each data channel typically is.
 */
const SIGNAL_BASE_CONFIDENCE = {
    calendar:      0.95,  // Calendar API — nearly deterministic
    location:      0.90,  // GPS / geofence — reliable but can drift indoors
    stress:        0.75,  // Sensor inference — physiological, some noise
    notifications: 0.85,  // OS events — direct, but count varies
    battery:       0.98,  // Battery API — extremely reliable
    activity:      0.80,  // Motion / activity recogniser — good but not perfect
    wifi:          0.70,  // SSID-based location proxy — can roam / spoof
    time:          1.00,  // System clock — perfect
};

/**
 * Build a confidence-annotated context object from raw context.
 *
 * @param {object} rawContext  - Plain context from contextReader.js
 * @returns {object}           - Same keys, now wrapped as { value, confidence }
 */
function buildConfidentContext(rawContext) {
    const confident = {};

    // Calendar
    const hasCalendar = rawContext.calendar_event && rawContext.calendar_event !== 'none';
    confident.calendar = {
        value: rawContext.calendar_event || 'none',
        confidence: hasCalendar ? SIGNAL_BASE_CONFIDENCE.calendar : 0.99,
        // If there is no event, we are very confident there is none
    };

    // Upcoming event (predictive field from contextReader enrichment)
    if (rawContext.upcoming_event) {
        confident.upcoming_event = {
            value: rawContext.upcoming_event,
            confidence: SIGNAL_BASE_CONFIDENCE.calendar,
        };
        confident.time_to_event = {
            value: rawContext.time_to_event,
            confidence: SIGNAL_BASE_CONFIDENCE.calendar,
        };
    }

    // Location
    const knownLocations = ['office', 'home', 'gym', 'commute'];
    const locationKnown = knownLocations.includes(rawContext.location);
    confident.location = {
        value: rawContext.location || 'unknown',
        confidence: locationKnown
            ? SIGNAL_BASE_CONFIDENCE.location
            : SIGNAL_BASE_CONFIDENCE.wifi,   // degraded if unknown
    };

    // Stress
    const stressValue = rawContext.stress ?? 0.5;
    confident.stress = {
        value: stressValue,
        confidence: SIGNAL_BASE_CONFIDENCE.stress,
    };

    // Notifications
    const notifValue = rawContext.notifications ?? 0;
    confident.notifications = {
        value: notifValue,
        confidence: SIGNAL_BASE_CONFIDENCE.notifications,
    };

    // Battery
    const batteryValue = rawContext.battery ?? 100;
    confident.battery = {
        value: batteryValue,
        confidence: SIGNAL_BASE_CONFIDENCE.battery,
    };

    // Activity
    confident.activity = {
        value: rawContext.activity || 'idle',
        confidence: SIGNAL_BASE_CONFIDENCE.activity,
    };

    // Time (always high confidence)
    confident.time = {
        value: new Date().getHours(),
        confidence: SIGNAL_BASE_CONFIDENCE.time,
    };

    return confident;
}

/**
 * Apply confidence penalties to candidate scores.
 * Each candidate's base score is multiplied by the confidence
 * of the primary signal that triggered it.
 *
 * @param {Array}  candidates       - From decisionEngine
 * @param {object} confidentContext - From buildConfidentContext()
 * @returns {Array}                 - Candidates with adjusted scores
 */
function applyConfidence(candidates, confidentContext) {
    // Map source → context key for lookup
    const sourceToSignal = {
        rule_calendar:      'calendar',
        rule_location:      'location',
        rule_stress:        'stress',
        rule_notifications: 'notifications',
        rule_battery:       'battery',
        rule_time:          'time',
        rule_predictive:    'upcoming_event',
        ai_llm:             null,   // LLM already factors uncertainty internally
        fallback:           null,
    };

    return candidates.map(c => {
        const signalKey = sourceToSignal[c.source];
        const confidence = signalKey && confidentContext[signalKey]
            ? confidentContext[signalKey].confidence
            : 0.80;   // default if unmapped

        return {
            ...c,
            signalConfidence: confidence,
            adjustedScore: +(c.score * confidence).toFixed(4),
        };
    });
}

/**
 * Format confidence context for human-readable explainability output.
 *
 * @param {object} confidentContext
 * @returns {string}
 */
function formatConfidenceReport(confidentContext) {
    const lines = ['\n📡 SIGNAL CONFIDENCE REPORT:'];
    for (const [key, signal] of Object.entries(confidentContext)) {
        const bar = '█'.repeat(Math.round(signal.confidence * 10)).padEnd(10, '░');
        const pct = (signal.confidence * 100).toFixed(0).padStart(3);
        lines.push(`   ${key.padEnd(18)} [${bar}] ${pct}%  →  ${JSON.stringify(signal.value)}`);
    }
    return lines.join('\n');
}

module.exports = {
    buildConfidentContext,
    applyConfidence,
    formatConfidenceReport,
    SIGNAL_BASE_CONFIDENCE,
};
