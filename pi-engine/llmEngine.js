const axios = require('axios');
require('dotenv').config();

/**
 * LLM Engine - Integrates with OpenAI for AI-powered decisions
 * Uses GPT-4o-mini for cost-effective persona suggestions
 */

async function askLLM(context) {
    const apiKey = process.env.OPENAI_API_KEY;

    // Fallback for mock mode when API key isn't set
    if (!apiKey) {
        console.log("⚠️  No OpenAI API key found. Using mock LLM response");
        return generateMockLLMResponse(context);
    }

    try {
        console.log("🤖 Querying LLM for persona suggestion...");

        const systemPrompt = `You are an intelligent persona decision system. Analyze the user's context and suggest the best persona to adopt.

Available personas: work, fitness, calm, creative, social, learning, productivity, relaxation, focus.

Return ONLY valid JSON (no markdown, no explanations):
{
  "persona": "persona_name",
  "score": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Current context: ${JSON.stringify(context)}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const text = response.data.choices[0].message.content.trim();
        
        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Invalid JSON response from LLM");
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log("✅ LLM Response:", result);
        return result;

    } catch (err) {
        console.error("❌ LLM API Error:", err.message);
        console.log("🔄 Fallback to mock response");
        return generateMockLLMResponse(context);
    }
}

/**
 * Mock LLM response for testing without API key
 */
function generateMockLLMResponse(context) {
    const mockResponses = {
        "meeting": { persona: "work", score: 0.95, reasoning: "Meeting detected in calendar" },
        "gym": { persona: "fitness", score: 0.9, reasoning: "Location is gym" },
        "high_stress": { persona: "calm", score: 0.88, reasoning: "Stress level is high" },
        "creative": { persona: "creative", score: 0.85, reasoning: "Time for creative work" },
        "social": { persona: "social", score: 0.8, reasoning: "Social activity detected" },
        "learning": { persona: "learning", score: 0.82, reasoning: "Learning time" },
        "idle": { persona: "relaxation", score: 0.75, reasoning: "No activity detected" }
    };

    // Smart heuristic selection
    if (context.calendar_event && context.calendar_event !== "none") {
        return mockResponses["meeting"];
    }
    if (context.location === "gym") {
        return mockResponses["gym"];
    }
    if (context.stress > 0.6) {
        return mockResponses["high_stress"];
    }
    if (context.activity === "creative_work") {
        return mockResponses["creative"];
    }
    if (context.activity === "social") {
        return mockResponses["social"];
    }
    if (context.activity === "learning") {
        return mockResponses["learning"];
    }

    return mockResponses["idle"];
}

module.exports = { askLLM };
