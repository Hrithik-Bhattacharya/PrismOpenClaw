const { askLLM } = require('./llmEngine');
const { applyConfidence } = require('./confidenceEngine');

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           DECISION ENGINE v2 — Hybrid Rule + AI + Predict        ║
 * ║                                                                  ║
 * ║  NEW in v2:                                                      ║
 * ║  ✅ Predictive switching (acts BEFORE context happens)           ║
 * ║  ✅ Confidence-weighted scoring (uncertain signals penalized)     ║
 * ║  ✅ Explainable decisions (full reasoning chain logged)           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// RULE-BASED DECISION FUNCTIONS
// Each function returns a candidate object or null.
// Candidates: { persona, score, source, reasoning, signalKey }
// ─────────────────────────────────────────────────────────────────────────────

function _ruleCalendar(context) {
    if (context.calendar_event && context.calendar_event !== 'none') {
        return {
            persona: 'work',
            score: 0.92,
            source: 'rule_calendar',
            signalKey: 'calendar',
            reasoning: `Active calendar event: "${context.calendar_event}"`,
        };
    }
    return null;
}

function _rulePredictive(context) {
    /**
     * 🔮 PREDICTIVE INTELLIGENCE
     * If an event is coming up in <15 minutes, pre-emptively switch to work
     * so the user is ready BEFORE the meeting starts.
     */
    if (context.upcoming_event && typeof context.time_to_event === 'number') {
        const minutesAway = context.time_to_event;

        if (minutesAway <= 5) {
            return {
                persona: 'work',
                score: 0.97,
                source: 'rule_predictive',
                signalKey: 'upcoming_event',
                reasoning: `🔮 PREDICTIVE: "${context.upcoming_event}" starts in ${minutesAway} min — switching NOW`,
                predictive: true,
                urgency: 'critical',
            };
        }

        if (minutesAway <= 15) {
            return {
                persona: 'work',
                score: 0.93,
                source: 'rule_predictive',
                signalKey: 'upcoming_event',
                reasoning: `🔮 PREDICTIVE: "${context.upcoming_event}" starts in ${minutesAway} min — preparing early`,
                predictive: true,
                urgency: 'high',
            };
        }

        if (minutesAway <= 30) {
            return {
                persona: 'productivity',
                score: 0.82,
                source: 'rule_predictive',
                signalKey: 'upcoming_event',
                reasoning: `🔮 PREDICTIVE: "${context.upcoming_event}" in ${minutesAway} min — ramping up productivity`,
                predictive: true,
                urgency: 'medium',
            };
        }
    }
    return null;
}

function _ruleLocation(context) {
    const locationMap = {
        gym:     { persona: 'fitness',     score: 0.88, reasoning: 'Location detected: gym'    },
        home:    { persona: 'relaxation',  score: 0.75, reasoning: 'Location detected: home'   },
        office:  { persona: 'work',        score: 0.80, reasoning: 'Location detected: office' },
        commute: { persona: 'focus',       score: 0.70, reasoning: 'Location detected: commute — focus during travel' },
    };

    const match = locationMap[context.location];
    if (match) {
        return { ...match, source: 'rule_location', signalKey: 'location' };
    }
    return null;
}

function _ruleStress(context) {
    if (context.stress > 0.7) {
        return {
            persona: 'calm',
            score: 0.90,
            source: 'rule_stress',
            signalKey: 'stress',
            reasoning: `High stress detected (${(context.stress * 100).toFixed(0)}%) — calm mode`,
        };
    }
    if (context.stress < 0.3) {
        return {
            persona: 'productivity',
            score: 0.85,
            source: 'rule_stress',
            signalKey: 'stress',
            reasoning: `Low stress (${(context.stress * 100).toFixed(0)}%) — high-energy productivity`,
        };
    }
    return null;
}

function _ruleNotifications(context) {
    if (context.notifications > 5) {
        return {
            persona: 'focus',
            score: 0.83,
            source: 'rule_notifications',
            signalKey: 'notifications',
            reasoning: `Notification overload (${context.notifications} pending) — enter focus`,
        };
    }
    return null;
}

function _ruleBattery(context) {
    if (context.battery < 20) {
        return {
            persona: 'power_saver',
            score: 0.80,
            source: 'rule_battery',
            signalKey: 'battery',
            reasoning: `Battery critical (${context.battery}%) — conserve power`,
        };
    }
    return null;
}

function _ruleTime(context) {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
        return {
            persona: 'sleep',
            score: 0.87,
            source: 'rule_time',
            signalKey: 'time',
            reasoning: `Late night / early morning (${hour}:00) — sleep mode`,
        };
    }
    if (hour >= 6 && hour < 8) {
        return {
            persona: 'productivity',
            score: 0.72,
            source: 'rule_time',
            signalKey: 'time',
            reasoning: `Early morning (${hour}:00) — morning productivity window`,
        };
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DECISION FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decide the best persona for the given context.
 * Returns an ordered list of candidates with full reasoning.
 *
 * @param {object} rawContext        - Plain context object
 * @param {object} confidentContext  - Confidence-annotated context (from confidenceEngine)
 * @returns {Promise<Array>}         - Candidates array
 */
async function decidePersona(rawContext, confidentContext = null) {
    console.log('\n🧠 Decision Engine v2: Analyzing context...');

    const candidates = [];

    // ──────────────────────────────────────────────────────────────
    // STEP 1: 🔮 PREDICTIVE RULES (highest priority)
    // ──────────────────────────────────────────────────────────────
    console.log('   [Predictive] Checking upcoming events...');
    const predictive = _rulePredictive(rawContext);
    if (predictive) {
        candidates.push(predictive);
        console.log(`   🔮 PREDICTIVE HIT: ${predictive.reasoning}`);
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 2: 📅 REACTIVE RULES
    // ──────────────────────────────────────────────────────────────
    const rules = [
        _ruleCalendar,
        _ruleLocation,
        _ruleStress,
        _ruleNotifications,
        _ruleBattery,
        _ruleTime,
    ];

    for (const rule of rules) {
        const result = rule(rawContext);
        if (result) candidates.push(result);
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 3: 🤖 AI-ENHANCED DECISION
    // ──────────────────────────────────────────────────────────────
    try {
        const aiSuggestion = await askLLM(rawContext);
        if (aiSuggestion && aiSuggestion.persona) {
            candidates.push({
                persona: aiSuggestion.persona,
                score: aiSuggestion.score,
                source: 'ai_llm',
                signalKey: null,
                reasoning: aiSuggestion.reasoning || 'AI holistic analysis',
            });
        }
    } catch (err) {
        console.warn('   ⚠️  AI enhancement unavailable:', err.message);
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 4: 📡 APPLY CONFIDENCE WEIGHTS
    // ──────────────────────────────────────────────────────────────
    const weightedCandidates = confidentContext
        ? applyConfidence(candidates, confidentContext)
        : candidates.map(c => ({ ...c, signalConfidence: 1.0, adjustedScore: c.score }));

    // ──────────────────────────────────────────────────────────────
    // STEP 5: 🛡️ FALLBACK
    // ──────────────────────────────────────────────────────────────
    if (weightedCandidates.length === 0) {
        weightedCandidates.push({
            persona: 'default',
            score: 0.50,
            adjustedScore: 0.50,
            source: 'fallback',
            signalKey: null,
            signalConfidence: 1.0,
            reasoning: 'No matching rules — using default',
        });
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 6: 🖨️ DISPLAY ALL CANDIDATES
    // ──────────────────────────────────────────────────────────────
    console.log('\n📊 Persona Candidates (confidence-adjusted):');
    weightedCandidates
        .sort((a, b) => b.adjustedScore - a.adjustedScore)
        .forEach((c, idx) => {
            const flag = c.predictive ? ' 🔮' : '';
            const conf = c.signalConfidence != null
                ? ` | signal confidence: ${(c.signalConfidence * 100).toFixed(0)}%`
                : '';
            console.log(`  ${idx + 1}. ${c.persona.padEnd(14)} score: ${c.score.toFixed(2)} → adj: ${c.adjustedScore.toFixed(3)}${conf}${flag}`);
            console.log(`     └─ ${c.reasoning}`);
        });

    return weightedCandidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA DETAILS REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

function getPersonaDetails(personaName) {
    const personas = {
        work: {
            name: 'Work Mode',
            description: 'Professional, focused, productive',
            behaviors: ['mute_notifications', 'focus_mode', 'calendar_priority'],
        },
        fitness: {
            name: 'Fitness Mode',
            description: 'Active, energized, health-focused',
            behaviors: ['activity_tracking', 'health_reminders'],
        },
        calm: {
            name: 'Calm Mode',
            description: 'Relaxed, meditative, stress-relief',
            behaviors: ['meditation_suggestions', 'soothing_content'],
        },
        creative: {
            name: 'Creative Mode',
            description: 'Imaginative, experimental, open-minded',
            behaviors: ['idea_generation', 'inspiration_feeds'],
        },
        social: {
            name: 'Social Mode',
            description: 'Friendly, communicative, interactive',
            behaviors: ['message_prioritization', 'social_reminders'],
        },
        learning: {
            name: 'Learning Mode',
            description: 'Curious, focused, knowledge-seeking',
            behaviors: ['educational_content', 'tutorial_suggestions'],
        },
        productivity: {
            name: 'Productivity Mode',
            description: 'Efficient, goal-oriented, task-focused',
            behaviors: ['task_prioritization', 'deadline_alerts'],
        },
        relaxation: {
            name: 'Relaxation Mode',
            description: 'Unwinding, comfortable, leisure-focused',
            behaviors: ['entertainment_suggestions', 'comfort_mode'],
        },
        focus: {
            name: 'Deep Focus Mode',
            description: 'Maximum concentration, distraction-free',
            behaviors: ['block_notifications', 'single_task_mode'],
        },
        power_saver: {
            name: 'Power Saver Mode',
            description: 'Battery-aware, efficient, minimal operations',
            behaviors: ['reduce_updates', 'low_power_mode'],
        },
        sleep: {
            name: 'Sleep Mode',
            description: 'Quiet, minimal disturbance, night mode',
            behaviors: ['do_not_disturb', 'night_mode', 'silence_all'],
        },
        default: {
            name: 'Default Mode',
            description: 'Standard balanced mode',
            behaviors: ['normal_operation'],
        },
    };

    return personas[personaName] || personas.default;
}

module.exports = { decidePersona, getPersonaDetails };
