const { readContext, updateContext } = require('./contextReader');
const { decidePersona } = require('./decisionEngine');
const { resolveConflict, isSignificantTransition } = require('./conflictResolver');
const { executeAction } = require('./executor');
const { updateMemory } = require('./memoryManager');

/**
 * HEARTBEAT LOOP - Core intelligence engine
 * Continuously monitors context and makes persona decisions
 */

let heartbeatState = {
    isRunning: false,
    lastPersona: null,
    decisionCount: 0,
    startTime: null,
    cycleCount: 0,
    lastDecision: null,
    errors: 0
};

/**
 * Start heartbeat loop
 * @param {number} interval - Milliseconds between cycles (default: 10 seconds for testing)
 */
function startHeartbeat(interval = 10000) {
    if (heartbeatState.isRunning) {
        console.warn("⚠️  Heartbeat already running");
        return;
    }

    heartbeatState.isRunning = true;
    heartbeatState.startTime = new Date();

    console.log("\n" + "=".repeat(60));
    console.log("🚀 PI ENGINE STARTING");
    console.log("=".repeat(60));
    console.log(`⏱️  Heartbeat Interval: ${interval}ms (${(interval/1000).toFixed(1)}s)`);
    console.log(`📅 Started: ${heartbeatState.startTime.toLocaleString()}`);
    console.log("=".repeat(60) + "\n");

    // Main heartbeat loop
    const heartbeatInterval = setInterval(async () => {
        try {
            await performHeartbeatCycle();
        } catch (err) {
            heartbeatState.errors++;
            console.error(`\n❌ HEARTBEAT ERROR (${heartbeatState.errors}):`, err.message);
            console.error("Stack:", err.stack);
        }
    }, interval);

    // Store interval ID for cleanup
    heartbeatState.intervalId = heartbeatInterval;

    console.log("✅ Heartbeat running in background\n");
}

/**
 * Single heartbeat cycle - Main logic
 */
async function performHeartbeatCycle() {
    heartbeatState.cycleCount++;

    console.log(`\n${"─".repeat(60)}`);
    console.log(`🔁 CYCLE #${heartbeatState.cycleCount}`);
    console.log(`⏰ ${new Date().toLocaleTimeString()}`);
    console.log(`${"─".repeat(60)}`);

    // ============ STEP 1: READ CONTEXT ============
    console.log("\n[1/5] Reading context...");
    const context = await readContext();

    // ============ STEP 2: MAKE DECISIONS ============
    console.log("\n[2/5] Making persona decisions...");
    const personaCandidates = await decidePersona(context);

    // ============ STEP 3: RESOLVE CONFLICTS ============
    console.log("\n[3/5] Resolving conflicts...");
    const finalPersona = resolveConflict(personaCandidates);

    // ============ STEP 4: CHECK FOR TRANSITION ============
    console.log("\n[4/5] Checking for transition...");
    const isTransition = isSignificantTransition(heartbeatState.lastPersona, finalPersona);

    if (isTransition) {
        console.log(`🔄 Persona transition detected: "${heartbeatState.lastPersona || 'none'}" → "${finalPersona}"`);

        // ============ STEP 5: EXECUTE ============
        console.log("\n[5/5] Executing action...");
        const executionResult = await executeAction(finalPersona);

        if (executionResult.success) {
            heartbeatState.lastPersona = finalPersona;
            heartbeatState.decisionCount++;

            // ============ STEP 6: UPDATE MEMORY ============
            console.log("\n[6/5] Updating memory...");
            const decision = personaCandidates.find(c => c.persona === finalPersona);
            updateMemory(context, finalPersona, decision);

            heartbeatState.lastDecision = {
                timestamp: new Date(),
                persona: finalPersona,
                context,
                success: true
            };
        }
    } else {
        console.log(`✓ No significant transition (staying with "${finalPersona}")`);
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

    console.log(`\n${"─".repeat(60)}`);
    console.log(`📊 CYCLE SUMMARY`);
    console.log(`   Current Persona: ${heartbeatState.lastPersona || "none"}`);
    console.log(`   Total Decisions: ${heartbeatState.decisionCount}`);
    console.log(`   Total Cycles: ${heartbeatState.cycleCount}`);
    console.log(`   Uptime: ${uptimeStr}`);
    console.log(`   Errors: ${heartbeatState.errors}`);
    console.log(`${"─".repeat(60)}\n`);
}

/**
 * Stop heartbeat loop
 */
function stopHeartbeat() {
    if (!heartbeatState.isRunning) {
        console.warn("⚠️  Heartbeat not running");
        return;
    }

    clearInterval(heartbeatState.intervalId);
    heartbeatState.isRunning = false;

    const uptime = Math.round((new Date() - heartbeatState.startTime) / 1000);
    const uptimeStr = formatUptime(uptime);

    console.log("\n" + "=".repeat(60));
    console.log("🛑 PI ENGINE STOPPED");
    console.log("=".repeat(60));
    console.log(`⏸️  Total Uptime: ${uptimeStr}`);
    console.log(`🔀 Total Cycles: ${heartbeatState.cycleCount}`);
    console.log(`🎯 Total Decisions: ${heartbeatState.decisionCount}`);
    console.log(`❌ Total Errors: ${heartbeatState.errors}`);
    console.log("=".repeat(60) + "\n");
}

/**
 * Get heartbeat status
 */
function getHeartbeatStatus() {
    return {
        ...heartbeatState,
        uptime: new Date() - heartbeatState.startTime,
        lastDecisionTime: heartbeatState.lastDecision?.timestamp
    };
}

/**
 * Pause heartbeat (but don't stop)
 */
function pauseHeartbeat() {
    if (!heartbeatState.isRunning) {
        console.warn("⚠️  Heartbeat not running");
        return;
    }

    clearInterval(heartbeatState.intervalId);
    console.log("⏸️  Heartbeat paused");
}

/**
 * Resume paused heartbeat
 */
function resumeHeartbeat(interval = 10000) {
    if (heartbeatState.isRunning) {
        console.warn("⚠️  Heartbeat already running");
        return;
    }

    heartbeatState.isRunning = true;
    const heartbeatInterval = setInterval(async () => {
        try {
            await performHeartbeatCycle();
        } catch (err) {
            heartbeatState.errors++;
            console.error(`❌ Heartbeat error:`, err.message);
        }
    }, interval);

    heartbeatState.intervalId = heartbeatInterval;
    console.log("▶️  Heartbeat resumed");
}

/**
 * Format uptime string
 */
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

module.exports = {
    startHeartbeat,
    stopHeartbeat,
    pauseHeartbeat,
    resumeHeartbeat,
    performHeartbeatCycle,
    getHeartbeatStatus,
    heartbeatState
};
