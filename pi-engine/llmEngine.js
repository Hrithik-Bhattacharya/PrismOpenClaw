const axios = require("axios");

const PROVIDER = process.env.LLM_PROVIDER || "auto";

async function askLLM(context) {
    console.log(`[LLM] Provider: ${PROVIDER}`);
    
    if (PROVIDER === "groq") return askGroq(context);
    if (PROVIDER === "gemini") return askGemini(context);

    // AUTO FALLBACK
    try {
        return await askGroq(context);
    } catch (e) {
        console.log("⚠️ [LLM] Groq failed → switching to Gemini");
        return await askGemini(context);
    }
}

// ================= GROQ =================
async function askGroq(context) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an AI deciding the best persona. Return ONLY valid JSON: {\"persona\": \"name\", \"score\": 0.9, \"reason\": \"explanation\"}",
                },
                {
                    role: "user",
                    content: JSON.stringify(context),
                },
            ],
            temperature: 0.3,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );

    const text = response.data.choices[0].message.content;
    return safeParse(text);
}

// ================= GEMINI =================
async function askGemini(context) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [
                {
                    parts: [
                        {
                            text: `You are an AI deciding the best persona. Return ONLY valid JSON: {"persona": "name", "score": 0.9, "reason": "explanation"}. Context: ${JSON.stringify(context)}`,
                        },
                    ],
                },
            ],
        }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return safeParse(text);
}

// ================= SAFE PARSER =================
function safeParse(text) {
    try {
        // Remove code block if model returns ```json
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.log("⚠️ [LLM] Parse failed, fallback used", err.message);

        return {
            persona: "default",
            score: 0.5,
            reason: "fallback",
        };
    }
}

module.exports = { askLLM };
