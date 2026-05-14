const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateQuestions() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = "Generate 10 multiple choice crypto trivia questions about memes, hacks, communities, and crypto culture. Return ONLY a JSON array, no extra text, like this: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":0}] Where answer is the index (0-3) of the correct option.";

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

module.exports = generateQuestions;