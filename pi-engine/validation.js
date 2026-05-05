/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                 VALIDATION ENGINE — Guardrails                   ║
 * ║  Ensures data consistency across M1, M2, M3, and M4 modules      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const STRICT_CONTRACT = process.env.STRICT_CONTRACT === 'true';

/**
 * Validate incoming context from M3.
 * Falls back to default values for missing fields to prevent crashes,
 * unless STRICT_CONTRACT is true (for integration testing).
 */
function validateContext(rawContext) {
    console.log('[M1] Validating incoming context...');
    
    if (!rawContext || typeof rawContext !== 'object') {
        if (STRICT_CONTRACT) throw new Error('Invalid context received: must be an object');
        console.warn('⚠️  [M1] Invalid context received. Falling back to defaults.');
        return _getDefaultContext();
    }

    const validated = { ..._getDefaultContext() };
    const errors = [];

    // Location
    if (typeof rawContext.location === 'string') {
        validated.location = rawContext.location;
    } else {
        errors.push('location must be a string');
    }

    // Calendar Event
    if (typeof rawContext.calendar_event === 'string') {
        validated.calendar_event = rawContext.calendar_event;
    } else {
        errors.push('calendar_event must be a string');
    }

    // Upcoming Event
    if (rawContext.upcoming_event !== undefined) {
        validated.upcoming_event = rawContext.upcoming_event;
    }

    // Time to Event
    if (rawContext.time_to_event !== undefined && typeof rawContext.time_to_event === 'number') {
        validated.time_to_event = rawContext.time_to_event;
    }

    // Stress
    if (typeof rawContext.stress === 'number' && rawContext.stress >= 0 && rawContext.stress <= 1) {
        validated.stress = rawContext.stress;
    } else {
        errors.push('stress must be a number between 0 and 1');
    }

    // Battery
    if (typeof rawContext.battery === 'number' && rawContext.battery >= 0 && rawContext.battery <= 100) {
        validated.battery = rawContext.battery;
    } else {
        errors.push('battery must be a number between 0 and 100');
    }

    // Notifications
    if (typeof rawContext.notifications === 'number' && rawContext.notifications >= 0) {
        validated.notifications = rawContext.notifications;
    } else {
        errors.push('notifications must be a positive number');
    }

    // Activity
    if (typeof rawContext.activity === 'string') {
        validated.activity = rawContext.activity;
    } else {
        errors.push('activity must be a string');
    }

    if (errors.length > 0) {
        if (STRICT_CONTRACT) {
            console.error(`❌ [M1] STRICT CONTRACT VIOLATION: ${errors.join(', ')}`);
            throw new Error(`Strict Contract Violation: ${errors.join(', ')}`);
        }
        console.warn('⚠️  [M1] Context validation warnings (using fallbacks for missing data):', errors.join(', '));
    } else {
        console.log('✅ [M1] Context validation passed.');
    }

    return validated;
}

/**
 * Validate final decision payload before sending it to M2 or M4.
 * Ensures the output strictly adheres to the TEAM_INTEGRATION.md contract.
 */
function validateDecisionOutput(output) {
    if (!output || typeof output !== 'object') {
        throw new Error('Decision output must be a valid object');
    }

    const requiredFields = [
        'persona', 'confidence', 'is_predictive', 'transition',
        'actions', 'reason', 'explanation', 'requires_user_input', 'conflict', 'state', 'timestamp'
    ];

    const missingFields = requiredFields.filter(field => !(field in output));

    if (missingFields.length > 0) {
        console.error(`❌ [M1] FATAL VALIDATION ERROR: Missing fields in decision output: ${missingFields.join(', ')}`);
        // We throw here because M2/M4 cannot function without these fields
        throw new Error(`Invalid decision output schema. Missing: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(output.actions)) {
        throw new Error('output.actions must be an array');
    }

    return output;
}

/**
 * Robust default context fallback for when M3 fails or provides bad data.
 */
function _getDefaultContext() {
    return {
        location: 'unknown',
        calendar_event: 'none',
        upcoming_event: null,
        time_to_event: null,
        stress: 0.3,
        battery: 80,
        notifications: 0,
        activity: 'idle'
    };
}

module.exports = { validateContext, validateDecisionOutput };
