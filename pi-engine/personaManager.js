const fs = require('fs');
const path = require('path');

/**
 * Persona Manager - Manages persona definitions and configurations
 * Allows dynamic persona creation and customization
 */

const PERSONAS_FILE = path.join(__dirname, 'personas.json');

/**
 * Get all available personas
 */
function getAvailablePersonas() {
    const defaultPersonas = {
        work: {
            id: "work",
            name: "Work Mode",
            icon: "💼",
            description: "Professional, focused, productive environment",
            priority: 1,
            behaviors: [
                "mute_notifications",
                "focus_mode",
                "calendar_priority",
                "productivity_tracking"
            ],
            triggers: ["calendar_event", "location:office"],
            settings: {
                notifications: "work_only",
                sound: "silent",
                brightness: "high",
                dnd: true
            }
        },
        fitness: {
            id: "fitness",
            name: "Fitness Mode",
            icon: "💪",
            description: "Active, energized, health-focused activities",
            priority: 2,
            behaviors: [
                "activity_tracking",
                "health_reminders",
                "workout_music",
                "heart_rate_monitoring"
            ],
            triggers: ["location:gym", "activity:exercise"],
            settings: {
                notifications: "activity_only",
                brightness: "auto",
                keep_screen_on: true
            }
        },
        calm: {
            id: "calm",
            name: "Calm Mode",
            icon: "🧘",
            description: "Relaxed, meditative, stress-relief focused",
            priority: 3,
            behaviors: [
                "meditation_suggestions",
                "soothing_content",
                "breathing_reminders",
                "gentle_notifications"
            ],
            triggers: ["stress:high"],
            settings: {
                notifications: "minimal",
                sound: "soft_music",
                color_mode: "warm"
            }
        },
        creative: {
            id: "creative",
            name: "Creative Mode",
            icon: "🎨",
            description: "Imaginative, experimental, open-minded work",
            priority: 2,
            behaviors: [
                "idea_generation",
                "inspiration_feeds",
                "focus_timer",
                "mood_board"
            ],
            triggers: ["activity:creative_work"],
            settings: {
                notifications: "filtered",
                music: "creative_playlist"
            }
        },
        social: {
            id: "social",
            name: "Social Mode",
            icon: "👥",
            description: "Friendly, communicative, interactive activities",
            priority: 2,
            behaviors: [
                "message_prioritization",
                "social_reminders",
                "emoji_suggestions",
                "voice_chat_ready"
            ],
            triggers: ["activity:social"],
            settings: {
                notifications: "all",
                sound: "enabled"
            }
        },
        learning: {
            id: "learning",
            name: "Learning Mode",
            icon: "📚",
            description: "Curious, focused, knowledge-seeking activities",
            priority: 2,
            behaviors: [
                "educational_content",
                "tutorial_suggestions",
                "note_taking_support",
                "progress_tracking"
            ],
            triggers: ["activity:learning"],
            settings: {
                notifications: "learning_only",
                font_size: "large"
            }
        },
        productivity: {
            id: "productivity",
            name: "Productivity Mode",
            icon: "⚡",
            description: "Efficient, goal-oriented, task-focused work",
            priority: 1,
            behaviors: [
                "task_prioritization",
                "deadline_alerts",
                "time_tracking",
                "distraction_blocking"
            ],
            triggers: ["stress:low", "battery:sufficient"],
            settings: {
                dnd: true,
                notifications: "priority_only"
            }
        },
        relaxation: {
            id: "relaxation",
            name: "Relaxation Mode",
            icon: "😌",
            description: "Unwinding, comfortable, leisure-focused time",
            priority: 3,
            behaviors: [
                "entertainment_suggestions",
                "comfort_mode",
                "favorite_content",
                "cozy_environment"
            ],
            triggers: ["location:home", "time:evening"],
            settings: {
                notifications: "optional",
                color_mode: "warm",
                sound: "ambient"
            }
        },
        focus: {
            id: "focus",
            name: "Deep Focus Mode",
            icon: "🎯",
            description: "Maximum concentration, distraction-free work",
            priority: 1,
            behaviors: [
                "block_notifications",
                "single_task_mode",
                "timer_pomodoro",
                "ambient_focus_sounds"
            ],
            triggers: ["notifications:many"],
            settings: {
                dnd: true,
                notifications: "none",
                focus_mode: true
            }
        },
        power_saver: {
            id: "power_saver",
            name: "Power Saver Mode",
            icon: "🔋",
            description: "Battery-aware, efficient, minimal operations",
            priority: 3,
            behaviors: [
                "reduce_updates",
                "low_power_mode",
                "disable_animations",
                "background_task_limit"
            ],
            triggers: ["battery:low"],
            settings: {
                brightness: "low",
                refresh_rate: "60hz",
                background_updates: "disabled"
            }
        },
        sleep: {
            id: "sleep",
            name: "Sleep Mode",
            icon: "😴",
            description: "Quiet, minimal disturbance, night mode",
            priority: 3,
            behaviors: [
                "do_not_disturb",
                "night_mode",
                "silence_all",
                "blue_light_filter"
            ],
            triggers: ["time:late_night"],
            settings: {
                notifications: "emergency_only",
                sound: "silent",
                display: "minimal",
                brightness: "minimum"
            }
        },
        default: {
            id: "default",
            name: "Default Mode",
            icon: "⚙️",
            description: "Standard balanced mode",
            priority: 0,
            behaviors: ["normal_operation"],
            triggers: [],
            settings: {
                notifications: "normal"
            }
        }
    };

    // Load custom personas if available
    try {
        if (fs.existsSync(PERSONAS_FILE)) {
            const customPersonas = JSON.parse(fs.readFileSync(PERSONAS_FILE, 'utf-8'));
            return { ...defaultPersonas, ...customPersonas };
        }
    } catch (err) {
        console.warn("⚠️  Error loading custom personas:", err.message);
    }

    return defaultPersonas;
}

/**
 * Get persona by ID
 */
function getPersona(personaId) {
    const personas = getAvailablePersonas();
    return personas[personaId] || personas.default;
}

/**
 * Create custom persona
 */
function createPersona(personaData) {
    try {
        const personas = getAvailablePersonas();

        if (personas[personaData.id]) {
            console.warn(`⚠️  Persona "${personaData.id}" already exists`);
            return null;
        }

        personas[personaData.id] = {
            ...personaData,
            createdAt: new Date().toISOString(),
            custom: true
        };

        fs.writeFileSync(PERSONAS_FILE, JSON.stringify(personas, null, 2), 'utf-8');
        console.log(`✅ Persona "${personaData.id}" created successfully`);

        return personas[personaData.id];
    } catch (err) {
        console.error("❌ Error creating persona:", err.message);
        return null;
    }
}

/**
 * Update persona
 */
function updatePersona(personaId, updates) {
    try {
        const personas = getAvailablePersonas();

        if (!personas[personaId]) {
            console.warn(`⚠️  Persona "${personaId}" not found`);
            return null;
        }

        personas[personaId] = {
            ...personas[personaId],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(PERSONAS_FILE, JSON.stringify(personas, null, 2), 'utf-8');
        console.log(`✅ Persona "${personaId}" updated successfully`);

        return personas[personaId];
    } catch (err) {
        console.error("❌ Error updating persona:", err.message);
        return null;
    }
}

/**
 * Delete custom persona
 */
function deletePersona(personaId) {
    try {
        if (personaId === "default") {
            console.warn("⚠️  Cannot delete default persona");
            return false;
        }

        const personas = getAvailablePersonas();

        if (!personas[personaId]) {
            console.warn(`⚠️  Persona "${personaId}" not found`);
            return false;
        }

        delete personas[personaId];
        fs.writeFileSync(PERSONAS_FILE, JSON.stringify(personas, null, 2), 'utf-8');
        console.log(`✅ Persona "${personaId}" deleted successfully`);

        return true;
    } catch (err) {
        console.error("❌ Error deleting persona:", err.message);
        return false;
    }
}

/**
 * List all personas
 */
function listPersonas() {
    const personas = getAvailablePersonas();
    console.log("\n📋 Available Personas:");
    console.log("─".repeat(60));

    Object.values(personas)
        .sort((a, b) => a.priority - b.priority)
        .forEach(p => {
            console.log(`${p.icon} ${p.name}`);
            console.log(`   ID: ${p.id}`);
            console.log(`   ${p.description}`);
            console.log(`   Behaviors: ${p.behaviors.join(", ")}`);
            console.log("");
        });

    return personas;
}

module.exports = {
    getAvailablePersonas,
    getPersona,
    createPersona,
    updatePersona,
    deletePersona,
    listPersonas
};
