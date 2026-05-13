const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateQuestions() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await model.generateContent(`
    Generate 10 multiple choice crypto trivia questions about 
    memes, hacks, communities, and crypto culture.
    Return ONLY a JSON array, no extra text, like this:
    [{"question":"...","options":["A","B","C","D"],"answer":0}]
    Where answer is the index (0-3) of the correct option.
  `);

  const text = result.response.text();
  const clean = text.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(clean);
}

module.exports = generateQuestions;