const { getPersonaDetails } = require('./decisionEngine');

/**
 * Executor - Executes persona changes
 * Later, this will call M2 (ADB) and M4 (Telegram UI)
 * Currently logs to console (mock execution)
 */

async function executeAction(persona) {
    console.log(`\n⚙️ EXECUTOR: Activating persona "${persona}"...`);

    const details = getPersonaDetails(persona);

    console.log(`\n✨ ${details.name.toUpperCase()}`);
    console.log(`   ${details.description}`);
    console.log(`\n   Behaviors:`);
    details.behaviors.forEach(b => {
        console.log(`   ✓ ${b}`);
    });

    // ============ MOCK EXECUTION ============

    try {
        // Log execution
        console.log(`\n   🔄 Executing behaviors...`);
        
        await executeBehaviors(persona, details.behaviors);

        console.log(`   ✅ Persona "${persona}" activated successfully!`);
        return {
            success: true,
            persona,
            timestamp: new Date().toISOString(),
            details
        };
    } catch (err) {
        console.error(`   ❌ Execution failed:`, err.message);
        return {
            success: false,
            persona,
            error: err.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Execute individual behaviors
 * Placeholder for actual M2 (ADB) and M4 (Telegram) calls
 */
async function executeBehaviors(persona, behaviors) {
    for (const behavior of behaviors) {
        console.log(`      ⟳ ${behavior}...`);

        // Later, these will be replaced with:
        // - ADB commands (M2)
        // - Telegram messages (M4)
        // - Real device actions

        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log(`         ✓ Done`);
    }
}

/**
 * Send notification to user
 * Later this will send via M4 (Telegram)
 */
async function notifyUser(persona, message) {
    console.log(`\n📢 NOTIFICATION:`);
    console.log(`   Persona: ${persona}`);
    console.log(`   Message: ${message}`);

    // TODO: Send via Telegram (M4)
    // sendTelegramMessage(message);
}

/**
 * Rollback persona execution
 * In case of errors or user override
 */
async function rollbackExecution(persona) {
    console.log(`\n🔙 Rolling back persona "${persona}"...`);
    
    // Reset to default state
    return await executeAction("default");
}

/**
 * Get execution status
 */
function getExecutionStatus() {
    return {
        lastExecution: new Date().toISOString(),
        activePersona: null, // Will be set by heartbeat
        status: "ready"
    };
}

module.exports = {
    executeAction,
    executeBehaviors,
    notifyUser,
    rollbackExecution,
    getExecutionStatus
};
