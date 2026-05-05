const { askLLM } = require('./llmEngine');

/**
 * Decision Engine - Hybrid approach combining rules + AI
 * Rule-based for known patterns, AI-enhanced for complex scenarios
 */

async function decidePersona(context) {
    console.log("\n🧠 Decision Engine: Analyzing context...");

    let candidates = [];

    // ============ RULE-BASED DECISIONS ============

    // Meeting Detection
    if (context.calendar_event && context.calendar_event !== "none") {
        candidates.push({
            persona: "work",
            score: 0.92,
            source: "rule_calendar",
            reasoning: `Calendar event detected: ${context.calendar_event}`
        });
    }

    // Location-based decisions
    if (context.location === "gym") {
        candidates.push({
            persona: "fitness",
            score: 0.88,
            source: "rule_location",
            reasoning: "Location is gym"
        });
    } else if (context.location === "home") {
        candidates.push({
            persona: "relaxation",
            score: 0.75,
            source: "rule_location",
            reasoning: "At home, relaxation mode"
        });
    } else if (context.location === "office") {
        candidates.push({
            persona: "work",
            score: 0.80,
            source: "rule_location",
            reasoning: "In office environment"
        });
    }

    // Stress-based decisions
    if (context.stress > 0.7) {
        candidates.push({
            persona: "calm",
            score: 0.90,
            source: "rule_stress",
            reasoning: `High stress level: ${context.stress}`
        });
    } else if (context.stress < 0.3) {
        candidates.push({
            persona: "productivity",
            score: 0.85,
            source: "rule_stress",
            reasoning: "Low stress, high energy mode"
        });
    }

    // Notification overload detection
    if (context.notifications > 5) {
        candidates.push({
            persona: "focus",
            score: 0.83,
            source: "rule_notifications",
            reasoning: `Too many notifications (${context.notifications})`
        });
    }

    // Battery-aware decisions
    if (context.battery < 20) {
        candidates.push({
            persona: "power_saver",
            score: 0.80,
            source: "rule_battery",
            reasoning: "Low battery - conserve power"
        });
    }

    // Time-based decisions
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
        candidates.push({
            persona: "sleep",
            score: 0.87,
            source: "rule_time",
            reasoning: "Late night/early morning"
        });
    }

    // ============ AI-ENHANCED DECISION ============

    try {
        const aiSuggestion = await askLLM(context);
        if (aiSuggestion && aiSuggestion.persona) {
            candidates.push({
                persona: aiSuggestion.persona,
                score: aiSuggestion.score,
                source: "ai_llm",
                reasoning: aiSuggestion.reasoning || "AI decision"
            });
        }
    } catch (err) {
        console.error("❌ AI enhancement failed:", err.message);
    }

    // ============ FALLBACK ============
    if (candidates.length === 0) {
        candidates.push({
            persona: "default",
            score: 0.50,
            source: "fallback",
            reasoning: "No matching rules, using default"
        });
    }

    // Show all candidates
    console.log("\n📊 Persona Candidates:");
    candidates.forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.persona} (score: ${c.score}, source: ${c.source})`);
        console.log(`     └─ ${c.reasoning}`);
    });

    return candidates;
}

/**
 * Get persona details
 */
function getPersonaDetails(personaName) {
    const personas = {
        work: {
            name: "Work Mode",
            description: "Professional, focused, productive",
            behaviors: ["mute_notifications", "focus_mode", "calendar_priority"]
        },
        fitness: {
            name: "Fitness Mode",
            description: "Active, energized, health-focused",
            behaviors: ["activity_tracking", "health_reminders"]
        },
        calm: {
            name: "Calm Mode",
            description: "Relaxed, meditative, stress-relief",
            behaviors: ["meditation_suggestions", "soothing_content"]
        },
        creative: {
            name: "Creative Mode",
            description: "Imaginative, experimental, open-minded",
            behaviors: ["idea_generation", "inspiration_feeds"]
        },
        social: {
            name: "Social Mode",
            description: "Friendly, communicative, interactive",
            behaviors: ["message_prioritization", "social_reminders"]
        },
        learning: {
            name: "Learning Mode",
            description: "Curious, focused, knowledge-seeking",
            behaviors: ["educational_content", "tutorial_suggestions"]
        },
        productivity: {
            name: "Productivity Mode",
            description: "Efficient, goal-oriented, task-focused",
            behaviors: ["task_prioritization", "deadline_alerts"]
        },
        relaxation: {
            name: "Relaxation Mode",
            description: "Unwinding, comfortable, leisure-focused",
            behaviors: ["entertainment_suggestions", "comfort_mode"]
        },
        focus: {
            name: "Deep Focus Mode",
            description: "Maximum concentration, distraction-free",
            behaviors: ["block_notifications", "single_task_mode"]
        },
        power_saver: {
            name: "Power Saver Mode",
            description: "Battery-aware, efficient, minimal operations",
            behaviors: ["reduce_updates", "low_power_mode"]
        },
        sleep: {
            name: "Sleep Mode",
            description: "Quiet, minimal disturbance, night mode",
            behaviors: ["do_not_disturb", "night_mode", "silence_all"]
        },
        default: {
            name: "Default Mode",
            description: "Standard balanced mode",
            behaviors: ["normal_operation"]
        }
    };

    return personas[personaName] || personas.default;
}

module.exports = { decidePersona, getPersonaDetails };
