# 📚 PI ENGINE - QUICK REFERENCE GUIDE

## Command Reference

```bash
# Start the engine
node index.js start

# Stop the engine (Ctrl+C or in another terminal)
node index.js stop

# Check status
node index.js status

# List all personas
node index.js personas

# View memory statistics
node index.js memory

# Run tests
node index.js test

# Show this help
node index.js help
```

## API Quick Reference

### Context Reader
```javascript
const { readContext, updateContext } = require('./contextReader');

// Read current context
const context = readContext();

// Update context
updateContext({
    location: 'home',
    stress: 0.5,
    battery: 80
});
```

### Decision Engine
```javascript
const { decidePersona, getPersonaDetails } = require('./decisionEngine');

// Get persona candidates
const candidates = await decidePersona(context);

// Get persona details
const persona = getPersonaDetails('work');
// Returns: {name, description, behaviors, triggers, settings}
```

### Conflict Resolver
```javascript
const { resolveConflict, isSignificantTransition } = require('./conflictResolver');

// Pick best persona
const selectedPersona = resolveConflict(candidates);

// Check if transition is significant
const isChange = isSignificantTransition(oldPersona, newPersona);
```

### Executor
```javascript
const {
    executeAction,
    executeBehaviors,
    notifyUser,
    rollbackExecution
} = require('./executor');

// Execute persona activation
const result = await executeAction('work');

// Notify user
await notifyUser('work', 'Focus mode activated');

// Rollback if needed
await rollbackExecution('work');
```

### Memory Manager
```javascript
const {
    updateMemory,
    getRecentMemory,
    generateMemoryStats,
    exportMemory,
    getMemorySummary
} = require('./memoryManager');

// Record decision
updateMemory(context, persona, decision);

// Get last 10 entries
const recent = getRecentMemory(10);

// Generate statistics
const stats = generateMemoryStats();

// Export for analysis
exportMemory('backup.json');

// Get summary
const summary = getMemorySummary();
```

### Persona Manager
```javascript
const {
    getAvailablePersonas,
    getPersona,
    createPersona,
    updatePersona,
    deletePersona,
    listPersonas
} = require('./personaManager');

// Get all personas
const personas = getAvailablePersonas();

// Get specific persona
const work = getPersona('work');

// Create custom persona
createPersona({
    id: 'gaming',
    name: 'Gaming Mode',
    icon: '🎮',
    description: '...',
    behaviors: [...]
});

// Update persona
updatePersona('work', { priority: 2 });

// Delete persona
deletePersona('gaming');
```

### Heartbeat
```javascript
const {
    startHeartbeat,
    stopHeartbeat,
    pauseHeartbeat,
    resumeHeartbeat,
    getHeartbeatStatus
} = require('./heartbeat');

// Start heartbeat (10 second cycles)
startHeartbeat(10000);

// Get current status
const status = getHeartbeatStatus();

// Pause/resume
pauseHeartbeat();
resumeHeartbeat();

// Stop
stopHeartbeat();
```

## Context Object

```javascript
{
    location: "office" | "home" | "gym" | "car" | ...,
    calendar_event: "meeting name" | "none",
    stress: 0.0 - 1.0,  // 0=calm, 1=stressed
    time: "HH:MM",
    battery: 0 - 100,
    notifications: number,
    activity: "working" | "exercise" | "social" | ...,
    music_playing: boolean,
    wifi_connected: boolean,
    bluetooth_on: boolean,
    screen_on: boolean,
    movement: "stationary" | "moving" | ...,
    proximity_people: "alone" | "nearby" | "crowded"
}
```

## Persona Response

```javascript
{
    id: "work",
    name: "Work Mode",
    icon: "💼",
    description: "Professional, focused, productive",
    priority: 1,
    behaviors: [
        "mute_notifications",
        "focus_mode",
        "calendar_priority"
    ],
    triggers: ["calendar_event", "location:office"],
    settings: {
        notifications: "work_only",
        sound: "silent",
        dnd: true
    }
}
```

## Decision Candidate

```javascript
{
    persona: "work",
    score: 0.9,           // 0-1
    source: "rule_calendar",
    reasoning: "Meeting detected"
}
```

## Memory Entry

```javascript
{
    timestamp: "2024-01-15T14:32:00Z",
    context: { /* full context object */ },
    persona: "work",
    decision: {
        persona: "work",
        score: 0.9,
        source: "rule_calendar"
    },
    metadata: {
        source: "rule_calendar",
        score: 0.9,
        confidence: "81.8%"
    }
}
```

## Integration Template - M3

```javascript
// contextReader.js - Replace readContext()

const axios = require('axios');

async function readContext() {
    try {
        const response = await axios.get(
            `${process.env.M3_API_URL}/context`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.M3_API_TOKEN}`
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error('M3 API error:', err.message);
        // Fallback to local context
        return JSON.parse(fs.readFileSync('./context.json'));
    }
}
```

## Integration Template - M2

```javascript
// executor.js - Replace executeBehaviors()

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function executeBehaviors(persona, behaviors) {
    const commands = {
        'mute_notifications': 'adb shell settings put global notification_sound ""',
        'focus_mode': 'adb shell am start -n com.example/.FocusMode',
        // Add more mappings
    };

    for (const behavior of behaviors) {
        const cmd = commands[behavior];
        if (cmd) {
            try {
                await execAsync(cmd);
                console.log(`✓ ${behavior}`);
            } catch (err) {
                console.error(`✗ ${behavior}: ${err.message}`);
            }
        }
    }
}
```

## Integration Template - M4

```javascript
// executor.js - Add notifyUser()

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyUser(persona, message) {
    try {
        await bot.sendMessage(
            CHAT_ID,
            `✅ ${persona.toUpperCase()}\n${message}`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: 'View Details', callback_data: `details_${persona}` }
                    ]]
                }
            }
        );
    } catch (err) {
        console.error('Telegram error:', err.message);
    }
}
```

## Environment Variables

```bash
# .env file

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# M3 Integration
M3_API_URL=http://localhost:3000
M3_API_TOKEN=your-token

# M2 Integration
ADB_HOST=localhost
ADB_PORT=5037

# M4 Integration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Engine Configuration
DEBUG=false
HEARTBEAT_INTERVAL=10000
```

## Common Workflows

### Workflow 1: Check Current State
```javascript
const { readContext } = require('./contextReader');
const { decidePersona } = require('./decisionEngine');
const { resolveConflict } = require('./conflictResolver');

const context = readContext();
const candidates = await decidePersona(context);
const persona = resolveConflict(candidates);
console.log(`Current persona: ${persona}`);
```

### Workflow 2: Manual Persona Override
```javascript
const { executeAction } = require('./executor');
const { updateMemory } = require('./memoryManager');
const { readContext } = require('./contextReader');

const context = readContext();
await executeAction('calm');  // Force calm mode
updateMemory(context, 'calm', { source: 'user_override', score: 1.0 });
```

### Workflow 3: Add Custom Persona
```javascript
const { createPersona } = require('./personaManager');

createPersona({
    id: 'gaming',
    name: 'Gaming Mode',
    icon: '🎮',
    description: 'Optimized for gaming',
    priority: 2,
    behaviors: [
        'high_performance',
        'no_notifications',
        'low_latency_mode'
    ],
    triggers: ['activity:gaming'],
    settings: {
        brightness: 'maximum',
        refresh_rate: '120hz',
        dnd: true
    }
});
```

### Workflow 4: Analyze Decision History
```javascript
const { getRecentMemory, generateMemoryStats } = require('./memoryManager');

const stats = generateMemoryStats();
console.log('Most used persona:', stats.topPersonas[0].persona);
console.log('Total decisions:', stats.totalEntries);
console.log('Average confidence:', stats.averageConfidence + '%');

const recent = getRecentMemory(5);
recent.forEach(entry => {
    console.log(`${entry.timestamp}: ${entry.persona} (${entry.metadata.confidence})`);
});
```

## Performance Tips

1. **Reduce frequency** - Change interval from 10s to 30s for slower devices
2. **Disable LLM** - Unset `OPENAI_API_KEY` to use rules only (~50ms per cycle)
3. **Cache results** - Reuse persona objects instead of querying repeatedly
4. **Clean memory** - Archive old memory logs to keep file size small
5. **Monitor performance** - Check memory and CPU with `node --inspect`

## Debugging

### Enable Debug Logging
```javascript
// At top of any file
process.env.DEBUG = 'pi-engine:*';
```

### Inspect Variables
```javascript
// In any module
console.log('Context:', JSON.stringify(context, null, 2));
console.log('Candidates:', candidates.map(c => `${c.persona}(${c.score})`));
console.log('Memory entries:', getRecentMemory(1).length);
```

### Performance Profiling
```bash
node --inspect index.js start
# Open chrome://inspect in Chrome
```

## File Locations

- Main entry: `index.js`
- Core modules: `*.js` (heartbeat, context reader, etc.)
- Config: `context.json`, `state.json`
- Data: `memory.log`, `memory.stats.json`
- Docs: `README.md`, `DEPLOYMENT.md`, `QUICK_REFERENCE.md`

---

**Ready to integrate? Start with M3!**

See DEPLOYMENT.md for step-by-step integration instructions.
