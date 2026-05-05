#!/usr/bin/env node

/**
 * PI Engine - Comprehensive Test Suite
 * Tests all core functionality
 */

const { readContext, updateContext } = require('./contextReader');
const { decidePersona, getPersonaDetails } = require('./decisionEngine');
const { resolveConflict } = require('./conflictResolver');
const { executeAction } = require('./executor');
const { updateMemory, getRecentMemory, generateMemoryStats } = require('./memoryManager');
const { getAvailablePersonas, getPersona } = require('./personaManager');

let testsPassed = 0;
let testsFailed = 0;
let testResults = [];

// ============ TEST UTILITIES ============

function test(name, fn) {
    try {
        console.log(`\n  🧪 ${name}`);
        fn();
        console.log(`     ✅ PASSED`);
        testsPassed++;
        testResults.push({ name, status: 'PASSED' });
    } catch (err) {
        console.error(`     ❌ FAILED: ${err.message}`);
        testsFailed++;
        testResults.push({ name, status: 'FAILED', error: err.message });
    }
}

async function asyncTest(name, fn) {
    try {
        console.log(`\n  🧪 ${name}`);
        await fn();
        console.log(`     ✅ PASSED`);
        testsPassed++;
        testResults.push({ name, status: 'PASSED' });
    } catch (err) {
        console.error(`     ❌ FAILED: ${err.message}`);
        testsFailed++;
        testResults.push({ name, status: 'FAILED', error: err.message });
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || ''}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertGT(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message || ''}\nExpected > ${expected}\nActual: ${actual}`);
    }
}

// ============ TEST SUITES ============

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              🧪 PI ENGINE COMPREHENSIVE TEST SUITE               ║
╚══════════════════════════════════════════════════════════════════╝
`);

// ────────────────────────────────────────────────────────────────
// SUITE 1: Context Reader Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n📋 SUITE 1: Context Reader');
console.log('─'.repeat(60));

test('Context reader returns object', () => {
    const context = readContext();
    assert(typeof context === 'object', 'Context should be an object');
});

test('Context has required fields', () => {
    const context = readContext();
    assert(context.location !== undefined, 'Should have location');
    assert(context.stress !== undefined, 'Should have stress');
    assert(context.battery !== undefined, 'Should have battery');
});

test('Context values are in valid ranges', () => {
    const context = readContext();
    assert(context.stress >= 0 && context.stress <= 1, 'Stress should be 0-1');
    assert(context.battery >= 0 && context.battery <= 100, 'Battery should be 0-100');
    assertGT(context.notifications, -1, 'Notifications should be >= 0');
});

test('Context update works', () => {
    const testContext = {
        location: "test_location",
        calendar_event: "test_event",
        stress: 0.5,
        battery: 50,
        notifications: 0,
        activity: "testing"
    };
    updateContext(testContext);
    const updated = readContext();
    assertEquals(updated.location, "test_location", 'Location should be updated');
});

// ────────────────────────────────────────────────────────────────
// SUITE 2: Decision Engine Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n🧠 SUITE 2: Decision Engine');
console.log('─'.repeat(60));

asyncTest('Decision engine returns candidates', async () => {
    const context = readContext();
    const candidates = await decidePersona(context);
    assert(Array.isArray(candidates), 'Should return array');
    assertGT(candidates.length, 0, 'Should have at least one candidate');
});

asyncTest('All candidates have required fields', async () => {
    const context = readContext();
    const candidates = await decidePersona(context);
    candidates.forEach(c => {
        assert(c.persona !== undefined, 'Should have persona');
        assert(c.score !== undefined, 'Should have score');
        assert(typeof c.score === 'number', 'Score should be number');
    });
});

asyncTest('Scores are in valid range', async () => {
    const context = readContext();
    const candidates = await decidePersona(context);
    candidates.forEach(c => {
        assert(c.score >= 0 && c.score <= 1, `Score should be 0-1, got ${c.score}`);
    });
});

asyncTest('Calendar triggers work', async () => {
    const context = {
        ...readContext(),
        calendar_event: "important_meeting",
        stress: 0.2,
        battery: 100
    };
    const candidates = await decidePersona(context);
    const hasWork = candidates.some(c => c.persona === 'work' && c.score > 0.7);
    assert(hasWork, 'Should suggest work persona for meetings');
});

asyncTest('Stress level triggers work', async () => {
    const context = {
        ...readContext(),
        calendar_event: "none",
        stress: 0.8,
        battery: 100
    };
    const candidates = await decidePersona(context);
    const hasCalm = candidates.some(c => c.persona === 'calm' && c.score > 0.7);
    assert(hasCalm, 'Should suggest calm persona for high stress');
});

// ────────────────────────────────────────────────────────────────
// SUITE 3: Conflict Resolver Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n⚔️  SUITE 3: Conflict Resolver');
console.log('─'.repeat(60));

asyncTest('Conflict resolver selects highest score', async () => {
    const context = readContext();
    const candidates = await decidePersona(context);
    const resolved = resolveConflict(candidates);
    assert(typeof resolved === 'string', 'Should return persona name');
    assert(resolved.length > 0, 'Should return non-empty persona');
});

asyncTest('Weighted scoring works correctly', async () => {
    const candidates = [
        { persona: 'work', score: 0.8, source: 'rule_calendar' },
        { persona: 'fitness', score: 0.85, source: 'rule_location' },
        { persona: 'calm', score: 0.7, source: 'rule_stress' }
    ];
    const resolved = resolveConflict(candidates);
    // Calendar has 1.1x weight, so 0.8 * 1.1 = 0.88
    // Should beat location (0.85 * 0.95 = 0.8075)
    assertEquals(resolved, 'work', 'Calendar-based decision should win');
});

test('Fallback works for empty candidates', () => {
    const resolved = resolveConflict([]);
    assertEquals(resolved, 'default', 'Should return default for empty list');
});

// ────────────────────────────────────────────────────────────────
// SUITE 4: Executor Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n⚙️  SUITE 4: Executor');
console.log('─'.repeat(60));

asyncTest('Executor returns success result', async () => {
    const result = await executeAction('work');
    assert(result.success === true, 'Should execute successfully');
    assertEquals(result.persona, 'work', 'Should track persona');
});

asyncTest('Executor works for all personas', async () => {
    const personas = ['work', 'fitness', 'calm', 'creative', 'social'];
    for (const persona of personas) {
        const result = await executeAction(persona);
        assert(result.success === true, `Should execute ${persona}`);
    }
});

// ────────────────────────────────────────────────────────────────
// SUITE 5: Memory Manager Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n💾 SUITE 5: Memory Manager');
console.log('─'.repeat(60));

test('Memory update succeeds', () => {
    const context = readContext();
    const result = updateMemory(context, 'work', { score: 0.9 });
    assert(result !== null, 'Should return entry');
    assertEquals(result.persona, 'work', 'Should record persona');
});

test('Memory retrieval works', () => {
    const recent = getRecentMemory(5);
    assert(Array.isArray(recent), 'Should return array');
});

test('Memory stats generation works', () => {
    const stats = generateMemoryStats();
    assert(stats !== null, 'Should generate stats');
    assert(stats.totalEntries >= 0, 'Should have entry count');
});

// ────────────────────────────────────────────────────────────────
// SUITE 6: Persona Manager Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n👤 SUITE 6: Persona Manager');
console.log('─'.repeat(60));

test('Get available personas returns object', () => {
    const personas = getAvailablePersonas();
    assert(typeof personas === 'object', 'Should return object');
    assertGT(Object.keys(personas).length, 5, 'Should have at least 5 personas');
});

test('Get persona by ID works', () => {
    const persona = getPersona('work');
    assertEquals(persona.id, 'work', 'Should return work persona');
    assert(persona.name !== undefined, 'Should have name');
    assert(persona.behaviors !== undefined, 'Should have behaviors');
});

test('Get persona details for all standard personas', () => {
    const standard = ['work', 'fitness', 'calm', 'creative', 'social'];
    standard.forEach(id => {
        const persona = getPersona(id);
        assert(persona.id === id, `Should get ${id} persona`);
        assert(Array.isArray(persona.behaviors), `${id} should have behaviors`);
    });
});

test('Default persona exists', () => {
    const def = getPersona('nonexistent');
    assertEquals(def.id, 'default', 'Should return default for unknown persona');
});

// ────────────────────────────────────────────────────────────────
// SUITE 7: Integration Tests
// ────────────────────────────────────────────────────────────────

console.log('\n\n🔗 SUITE 7: Integration Tests');
console.log('─'.repeat(60));

asyncTest('Full pipeline works', async () => {
    // 1. Read context
    const context = readContext();
    assert(context !== null, 'Should read context');

    // 2. Make decision
    const candidates = await decidePersona(context);
    assert(candidates.length > 0, 'Should generate candidates');

    // 3. Resolve
    const persona = resolveConflict(candidates);
    assert(persona !== null, 'Should resolve to persona');

    // 4. Execute
    const result = await executeAction(persona);
    assert(result.success === true, 'Should execute');

    // 5. Remember
    const decision = candidates.find(c => c.persona === persona);
    const memory = updateMemory(context, persona, decision);
    assert(memory !== null, 'Should record in memory');
});

asyncTest('Multiple cycles work independently', async () => {
    for (let i = 0; i < 3; i++) {
        const context = readContext();
        const candidates = await decidePersona(context);
        const persona = resolveConflict(candidates);
        assert(persona !== null, `Cycle ${i + 1} should complete`);
    }
});

// ────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────

console.log('\n\n' + '═'.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('═'.repeat(60));

console.log(`
  ✅ Passed:  ${testsPassed}
  ❌ Failed:  ${testsFailed}
  📈 Total:   ${testsPassed + testsFailed}
  💯 Success: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%
`);

if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Engine is ready for production.');
    process.exit(0);
} else {
    console.log(`⚠️  ${testsFailed} test(s) failed. Review above for details.`);
    process.exit(1);
}
