const fs = require('fs');
const path = require('path');

/**
 * Context Reader - Reads environmental data from context.json
 * Later, this will connect to M3 for real-world signals
 */

function readContext() {
    try {
        const contextPath = path.join(__dirname, 'context.json');
        const data = fs.readFileSync(contextPath, 'utf-8');
        const context = JSON.parse(data);
        console.log("📥 Context read successfully:", JSON.stringify(context, null, 2));
        return context;
    } catch (err) {
        console.error("❌ Error reading context:", err.message);
        // Return default mock context if file doesn't exist
        return {
            location: "office",
            calendar_event: "none",
            stress: 0.3,
            time: new Date().toLocaleTimeString(),
            battery: 85,
            notifications: 3,
            activity: "idle"
        };
    }
}

/**
 * Update context dynamically (for simulation)
 * Later this will be replaced with real M3 API calls
 */
function updateContext(newContext) {
    try {
        const contextPath = path.join(__dirname, 'context.json');
        fs.writeFileSync(contextPath, JSON.stringify(newContext, null, 2), 'utf-8');
        console.log("✅ Context updated successfully");
        return newContext;
    } catch (err) {
        console.error("❌ Error updating context:", err.message);
        return null;
    }
}

module.exports = { readContext, updateContext };
