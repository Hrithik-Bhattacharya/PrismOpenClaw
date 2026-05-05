const fs = require('fs');
const path = require('path');

/**
 * Memory Manager - Logs and retrieves execution history
 * Enables learning from past decisions
 */

const MEMORY_LOG_FILE = path.join(__dirname, 'memory.log');
const MEMORY_STATS_FILE = path.join(__dirname, 'memory.stats.json');

/**
 * Record memory entry
 */
function updateMemory(context, persona, decision) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            context: context,
            persona: persona,
            decision: decision,
            metadata: {
                source: decision.source,
                score: decision.score,
                confidence: ((decision.score / 1.1) * 100).toFixed(1)
            }
        };

        // Append to log file
        fs.appendFileSync(
            MEMORY_LOG_FILE,
            JSON.stringify(entry) + "\n",
            'utf-8'
        );

        console.log(`📝 Memory recorded: ${persona}`);
        
        return entry;
    } catch (err) {
        console.error("❌ Memory update failed:", err.message);
        return null;
    }
}

/**
 * Get recent memory entries
 */
function getRecentMemory(count = 10) {
    try {
        if (!fs.existsSync(MEMORY_LOG_FILE)) {
            return [];
        }

        const data = fs.readFileSync(MEMORY_LOG_FILE, 'utf-8');
        const entries = data
            .trim()
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .slice(-count);

        return entries;
    } catch (err) {
        console.error("❌ Error reading memory:", err.message);
        return [];
    }
}

/**
 * Generate memory statistics
 * Analyze patterns and preferences
 */
function generateMemoryStats() {
    try {
        const entries = getRecentMemory(1000); // Last 1000 entries

        if (entries.length === 0) {
            return {
                totalEntries: 0,
                personaFrequency: {},
                topPersonas: [],
                averageConfidence: 0
            };
        }

        // Count persona frequency
        const personaFrequency = {};
        let totalConfidence = 0;

        entries.forEach(entry => {
            personaFrequency[entry.persona] = (personaFrequency[entry.persona] || 0) + 1;
            totalConfidence += parseFloat(entry.metadata.confidence);
        });

        // Get top personas
        const topPersonas = Object.entries(personaFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([persona, count]) => ({
                persona,
                frequency: count,
                percentage: ((count / entries.length) * 100).toFixed(1)
            }));

        const stats = {
            totalEntries: entries.length,
            personaFrequency,
            topPersonas,
            averageConfidence: (totalConfidence / entries.length).toFixed(1),
            dateRange: {
                first: entries[0]?.timestamp,
                last: entries[entries.length - 1]?.timestamp
            }
        };

        // Save stats
        fs.writeFileSync(
            MEMORY_STATS_FILE,
            JSON.stringify(stats, null, 2),
            'utf-8'
        );

        return stats;
    } catch (err) {
        console.error("❌ Error generating stats:", err.message);
        return null;
    }
}

/**
 * Clear memory (reset)
 */
function clearMemory(confirmed = false) {
    if (!confirmed) {
        console.warn("⚠️  Clear memory requires confirmation");
        return false;
    }

    try {
        if (fs.existsSync(MEMORY_LOG_FILE)) {
            fs.unlinkSync(MEMORY_LOG_FILE);
            console.log("✅ Memory log cleared");
        }

        if (fs.existsSync(MEMORY_STATS_FILE)) {
            fs.unlinkSync(MEMORY_STATS_FILE);
            console.log("✅ Memory stats cleared");
        }

        return true;
    } catch (err) {
        console.error("❌ Error clearing memory:", err.message);
        return false;
    }
}

/**
 * Export memory for analysis
 */
function exportMemory(filename = 'memory-export.json') {
    try {
        const entries = getRecentMemory(10000);
        const stats = generateMemoryStats();

        const exportData = {
            exported: new Date().toISOString(),
            stats,
            recentEntries: entries
        };

        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

        console.log(`✅ Memory exported to ${filename}`);
        return filepath;
    } catch (err) {
        console.error("❌ Export failed:", err.message);
        return null;
    }
}

/**
 * Get memory summary
 */
function getMemorySummary() {
    const entries = getRecentMemory(5);
    const stats = generateMemoryStats();

    return {
        summary: {
            totalRecords: stats.totalEntries,
            favoritePersona: stats.topPersonas[0]?.persona || "unknown",
            averageConfidence: stats.averageConfidence + "%",
            lastEntries: entries
        },
        stats
    };
}

module.exports = {
    updateMemory,
    getRecentMemory,
    generateMemoryStats,
    clearMemory,
    exportMemory,
    getMemorySummary
};
