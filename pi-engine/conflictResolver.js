/**
 * Conflict Resolver - Scoring system to select best persona
 * Implements weighted scoring to handle multiple competing personas
 */

function resolveConflict(candidates) {
    console.log("\n⚔️ Conflict Resolver: Determining final persona...");

    if (!candidates || candidates.length === 0) {
        console.log("⚠️  No candidates provided, using default");
        return "default";
    }

    // ============ SCORING ALGORITHM ============

    // Apply weighted scores based on source priority
    const sourceWeights = {
        rule_calendar: 1.1,      // Calendar is highest priority
        rule_stress: 1.05,       // Stress is important
        rule_location: 0.95,     // Location matters
        rule_notifications: 0.90, // Notifications affect score
        rule_battery: 0.85,      // Battery is secondary
        rule_time: 0.80,         // Time is background
        ai_llm: 1.0              // AI is neutral baseline
    };

    // Calculate weighted scores
    const scoredCandidates = candidates.map(c => ({
        ...c,
        weightedScore: c.score * (sourceWeights[c.source] || 1.0)
    }));

    // Find best candidate
    let best = scoredCandidates[0];
    for (let i = 1; i < scoredCandidates.length; i++) {
        if (scoredCandidates[i].weightedScore > best.weightedScore) {
            best = scoredCandidates[i];
        }
    }

    // ============ CONFIDENCE CHECK ============

    const confidence = (best.weightedScore / 1.1) * 100; // Normalize to 100%

    console.log("\n🎯 FINAL DECISION:");
    console.log(`   Persona: ${best.persona}`);
    console.log(`   Base Score: ${best.score}`);
    console.log(`   Weighted Score: ${best.weightedScore.toFixed(3)}`);
    console.log(`   Confidence: ${confidence.toFixed(1)}%`);
    console.log(`   Source: ${best.source}`);
    console.log(`   Reason: ${best.reasoning}`);

    // Low confidence warning
    if (confidence < 60) {
        console.warn(`   ⚠️  LOW CONFIDENCE - Consider monitoring`);
    }

    return best.persona;
}

/**
 * Smooth transition detection
 * Returns true if persona transition is significant
 */
function isSignificantTransition(lastPersona, newPersona) {
    if (!lastPersona) return true; // First time is always significant

    // Define persona groups
    const groups = {
        work: ["work", "productivity", "focus"],
        rest: ["relaxation", "calm", "sleep"],
        activity: ["fitness", "social"],
        learning: ["learning", "creative"]
    };

    // Find groups
    let lastGroup = null;
    let newGroup = null;

    for (const [group, personas] of Object.entries(groups)) {
        if (personas.includes(lastPersona)) lastGroup = group;
        if (personas.includes(newPersona)) newGroup = group;
    }

    // If different groups, it's significant
    if (lastGroup !== newGroup) {
        return true;
    }

    // If exact same, not significant
    if (lastPersona === newPersona) {
        return false;
    }

    // Within same group, slightly significant
    return true;
}

module.exports = { resolveConflict, isSignificantTransition };
