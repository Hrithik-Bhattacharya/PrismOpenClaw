/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              EXPLAINABILITY ENGINE — WHY did it pick THAT?       ║
 * ║                                                                  ║
 * ║  Generates human-readable, judge-friendly decision reports       ║
 * ║  for every persona selection made by the Pi Engine.              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const { getPersonaDetails } = require('./decisionEngine');
const { describeTransition } = require('./transitionEngine');

/**
 * Generate a full explanation report for a persona decision.
 *
 * @param {object} params
 * @param {string}  params.selectedPersona     - The chosen persona ID
 * @param {Array}   params.candidates          - All candidates (confidence-weighted)
 * @param {object}  params.rawContext          - Original raw context
 * @param {object}  params.confidentContext    - Confidence-annotated context
 * @param {string}  params.previousPersona     - What persona was active before
 * @param {object}  params.transition          - Transition plan
 * @param {boolean} params.isPredictive        - Was this a predictive switch?
 * @returns {string}  Full explanation text
 */
function explainDecision({
    selectedPersona,
    candidates,
    rawContext,
    confidentContext,
    previousPersona,
    transition,
    isPredictive,
}) {
    const persona = getPersonaDetails(selectedPersona);
    const winner = candidates.find(c => c.persona === selectedPersona);
    const lines = [];

    // ──────────────────────────────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────────────────────────────
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              🧠 EXPLAINABLE AI — DECISION REPORT             ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    // ──────────────────────────────────────────────────────────────
    // SELECTED PERSONA
    // ──────────────────────────────────────────────────────────────
    const predictiveTag = isPredictive ? '  🔮 [PREDICTIVE — ACTING BEFORE EVENT]' : '';
    lines.push(`  ✅ Selected Persona : ${selectedPersona.toUpperCase()}${predictiveTag}`);
    lines.push(`  📛 Mode Name        : ${persona.name}`);
    lines.push(`  📝 Description      : ${persona.description}`);
    lines.push(`  ⚙️  Behaviors        : ${persona.behaviors.join(', ')}`);
    lines.push('');

    // ──────────────────────────────────────────────────────────────
    // WINNING SIGNAL
    // ──────────────────────────────────────────────────────────────
    if (winner) {
        lines.push('  📌 PRIMARY REASON:');
        lines.push(`     ${winner.reasoning}`);
        lines.push(`     Source     : ${winner.source}`);
        lines.push(`     Base Score : ${winner.score.toFixed(2)}`);
        if (winner.signalConfidence != null) {
            lines.push(`     Confidence : ${(winner.signalConfidence * 100).toFixed(0)}%`);
            lines.push(`     Adj. Score : ${winner.adjustedScore.toFixed(3)}`);
        }
    }
    lines.push('');

    // ──────────────────────────────────────────────────────────────
    // ALL CANDIDATES (ranked)
    // ──────────────────────────────────────────────────────────────
    lines.push('  📊 ALL EVALUATED SIGNALS:');
    const sorted = [...candidates].sort((a, b) => b.adjustedScore - a.adjustedScore);
    sorted.forEach((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        const predictiveMark = c.predictive ? ' 🔮' : '';
        const confStr = c.signalConfidence != null
            ? ` | conf ${(c.signalConfidence * 100).toFixed(0)}%`
            : '';
        lines.push(`     ${medal} ${c.persona.padEnd(14)} adj:${c.adjustedScore.toFixed(3)}${confStr}${predictiveMark}`);
        lines.push(`        └─ ${c.reasoning}`);
    });
    lines.push('');

    // ──────────────────────────────────────────────────────────────
    // TRANSITION INFO
    // ──────────────────────────────────────────────────────────────
    if (previousPersona && previousPersona !== selectedPersona) {
        lines.push('  🔄 TRANSITION:');
        lines.push(`     From: ${previousPersona} → To: ${selectedPersona}`);
        if (transition) {
            lines.push(`     Style: ${describeTransition(transition)}`);
            lines.push(`     Message: "${transition.message}"`);
        }
        lines.push('');
    }

    // ──────────────────────────────────────────────────────────────
    // CONTEXT SNAPSHOT
    // ──────────────────────────────────────────────────────────────
    lines.push('  📥 CONTEXT SNAPSHOT:');
    lines.push(`     Location       : ${rawContext.location || 'unknown'}`);
    lines.push(`     Calendar Event : ${rawContext.calendar_event || 'none'}`);
    if (rawContext.upcoming_event) {
        lines.push(`     Upcoming Event : "${rawContext.upcoming_event}" in ${rawContext.time_to_event} min  🔮`);
    }
    lines.push(`     Stress Level   : ${rawContext.stress != null ? (rawContext.stress * 100).toFixed(0) + '%' : 'unknown'}`);
    lines.push(`     Battery        : ${rawContext.battery != null ? rawContext.battery + '%' : 'unknown'}`);
    lines.push(`     Notifications  : ${rawContext.notifications ?? 'unknown'}`);
    lines.push(`     Activity       : ${rawContext.activity || 'idle'}`);
    lines.push(`     Timestamp      : ${new Date().toLocaleTimeString()}`);
    lines.push('');

    // ──────────────────────────────────────────────────────────────
    // CONFIDENCE SIGNAL TABLE
    // ──────────────────────────────────────────────────────────────
    if (confidentContext) {
        lines.push('  📡 SIGNAL CONFIDENCE TABLE:');
        for (const [key, signal] of Object.entries(confidentContext)) {
            const bar = '█'.repeat(Math.round(signal.confidence * 8)).padEnd(8, '░');
            const pct = (signal.confidence * 100).toFixed(0).padStart(3);
            const val = JSON.stringify(signal.value);
            lines.push(`     ${key.padEnd(16)} [${bar}] ${pct}%  →  ${val}`);
        }
        lines.push('');
    }

    // ──────────────────────────────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────────────────────────────
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║               🔍 End of Decision Explanation                 ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    const report = lines.join('\n');
    console.log(report);
    return report;
}

/**
 * Lightweight one-liner for logs (e.g. memory log entries).
 *
 * @param {string} persona
 * @param {object} winnerCandidate
 * @returns {string}
 */
function shortExplanation(persona, winnerCandidate) {
    if (!winnerCandidate) return `Selected: ${persona} (no reason available)`;
    const conf = winnerCandidate.signalConfidence != null
        ? ` [conf: ${(winnerCandidate.signalConfidence * 100).toFixed(0)}%]`
        : '';
    return `Selected: ${persona}${conf} — ${winnerCandidate.reasoning}`;
}

module.exports = { explainDecision, shortExplanation };
