require("dotenv").config();
const axios = require("axios");
const { askLLM } = require("./llmEngine.js");

const dummyContext = {
  location: "office",
  calendar_event: "none",
  stress: 0.3,
  battery: 90,
  notifications: 0,
  activity: "working"
};

async function testGroqDirectly() {
  console.log("=== Testing Groq Direct ===");
  try {
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
                    content: JSON.stringify(dummyContext),
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
    console.log("✅ Groq Success:", response.data.choices[0].message.content);
  } catch (err) {
    console.error("❌ Groq Failed:", err.response?.data || err.message);
  }
}

async function testGeminiDirectly() {
  console.log("\n=== Testing Gemini Direct ===");
  try {
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [
                {
                    parts: [
                        {
                            text: `You are an AI deciding the best persona. Return ONLY valid JSON: {"persona": "name", "score": 0.9, "reason": "explanation"}. Context: ${JSON.stringify(dummyContext)}`,
                        },
                    ],
                },
            ],
        }
    );
    console.log("✅ Gemini Success:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("❌ Gemini Failed:", err.response?.data || err.message);
  }
}

async function runTests() {
  await testGroqDirectly();
  await testGeminiDirectly();
}

runTests();
