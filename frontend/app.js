const BACKEND = "http://localhost:3001";
const CONTRACT_ADDRESS = "0xd9112CcE89254fe42b85a99d7503Dcd0009d47ED";
const ABI = [
  "function mintBadge() external",
  "function playerScores(address) view returns (uint)",
  "function hasMinted(address) view returns (bool)"
];

let wallet = null;
let questions = [];
let answers = [];
let currentQ = 0;
let selectedOption = null;

// Connect wallet
document.getElementById("connect-btn").addEventListener("click", async () => {
  if (!window.ethereum) return alert("Please install MetaMask!");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  wallet = accounts[0];
  document.getElementById("wallet-address").textContent = `Connected: ${wallet.slice(0,6)}...${wallet.slice(-4)}`;
  document.getElementById("connect-btn").textContent = "Connected ✓";
  document.getElementById("connect-btn").disabled = true;
  loadQuestions();
  loadLeaderboard();
});

// Load AI-generated questions from backend
async function loadQuestions() {
  document.getElementById("loading").style.display = "block";
  try {
    const res = await fetch(`${BACKEND}/questions`);
    questions = await res.json();
    answers = new Array(questions.length).fill(null);
    document.getElementById("loading").style.display = "none";
    document.getElementById("game-section").style.display = "block";
    showQuestion(0);
  } catch (err) {
    alert("Failed to load questions. Is the backend running?");
  }
}

// Show question
function showQuestion(index) {
  const q = questions[index];
  document.getElementById("question-number").textContent = `Question ${index + 1} of ${questions.length}`;
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("progress-fill").style.width = `${((index) / questions.length) * 100}%`;
  
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  selectedOption = null;
  document.getElementById("next-btn").style.display = "none";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${["A","B","C","D"][i]}. ${opt}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedOption = i;
      answers[index] = i;
      document.getElementById("next-btn").style.display = "block";
    });
    optionsDiv.appendChild(btn);
  });
}

// Next question
document.getElementById("next-btn").addEventListener("click", () => {
  if (selectedOption === null) return;
  if (currentQ < questions.length - 1) {
    currentQ++;
    showQuestion(currentQ);
  } else {
    submitAnswers();
  }
});

// Submit answers to backend
async function submitAnswers() {
  document.getElementById("game-section").style.display = "none";
  document.getElementById("loading").style.display = "block";
  document.getElementById("loading").textContent = "⏳ Recording your score on-chain...";

  try {
    const res = await fetch(`${BACKEND}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, playerAddress: wallet, questions })
    });
    const data = await res.json();
    document.getElementById("loading").style.display = "none";
    showResult(data.score, data.total);
    loadLeaderboard();
  } catch (err) {
    alert("Error submitting answers: " + err.message);
  }
}

// Show result
function showResult(score, total) {
  document.getElementById("result-section").style.display = "block";
  document.getElementById("score-display").textContent = `${score}/${total}`;
  
  if (score >= 7) {
    document.getElementById("result-message").textContent = "🎉 You passed! Mint your NFT badge!";
    document.getElementById("mint-btn").style.display = "inline-block";
  } else {
    document.getElementById("result-message").textContent = "Keep studying ser! You need 7/10 to earn a badge.";
  }
}

// Mint NFT badge
document.getElementById("mint-btn").addEventListener("click", async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.mintBadge();
    await tx.wait();
    alert("🏆 NFT Badge minted successfully!");
    document.getElementById("mint-btn").style.display = "none";
    loadLeaderboard();
  } catch (err) {
    alert("Mint failed: " + err.message);
  }
});

// Play again
document.getElementById("play-again-btn").addEventListener("click", () => {
  currentQ = 0;
  answers = [];
  document.getElementById("result-section").style.display = "none";
  document.getElementById("loading").textContent = "⏳ Loading questions from AI...";
  loadQuestions();
});

// Load leaderboard
async function loadLeaderboard() {
  try {
    const res = await fetch(`${BACKEND}/leaderboard`);
    const data = await res.json();
    const div = document.getElementById("leaderboard");
    
    if (data.length === 0) {
      div.innerHTML = "<p style='color:#888'>No players yet. Be the first!</p>";
      return;
    }

    div.innerHTML = data.map((entry, i) => `
      <div class="lb-entry">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-address">${entry.player.slice(0,6)}...${entry.player.slice(-4)}</span>
        <span class="lb-score">${entry.score}/10</span>
        <span class="lb-badge">${entry.hasBadge ? "🏆 Badge" : ""}</span>
      </div>
    `).join("");
  } catch (err) {
    console.log("Leaderboard error:", err);
  }
}