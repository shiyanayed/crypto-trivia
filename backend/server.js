require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const generateQuestions = require("./questions");
const app = express();
app.use(cors());
app.use(express.json());
const CONTRACT_ADDRESS = "0x3e3340412A0d3DaeF45D366b68380f424Dd4de46";
const ABI = [
  "function recordScore(address player, uint score) external",
  "function playerScores(address) view returns (uint)",
  "function getLeaderboard() view returns (tuple(address player, uint score, bool hasBadge)[])"
];
const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
app.get("/questions", async (req, res) => {
  try {
    const questions = await generateQuestions();
    const safe = questions.map((q, i) => ({
      id: i,
      question: q.question,
      options: q.options
    }));
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/submit", async (req, res) => {
  const { answers, playerAddress, questions } = req.body;
  let score = 0;
  answers.forEach((ans, i) => {
    if (ans === questions[i].answer) score++;
  });
  try {
    const tx = await contract.recordScore(playerAddress, score);
    await tx.wait();
    res.json({ score, total: questions.length, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/leaderboard", async (req, res) => {
  try {
    const data = await contract.getLeaderboard();
    const board = data.map(e => ({
      player: e.player,
      score: Number(e.score),
      hasBadge: e.hasBadge
    }));
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(3001, () => console.log("Backend running on port 3001")); 