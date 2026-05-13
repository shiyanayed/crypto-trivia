const hre = require("hardhat");

async function main() {
  console.log("Deploying TriviaGame contract...");

  // Badge image URI from Pinata (we'll update this later)
  const badgeURI = "https://t.co/eXXaDgBCJ2";

  const TriviaGame = await hre.ethers.getContractFactory("TriviaGame");
  const triviaGame = await TriviaGame.deploy(badgeURI);

  await triviaGame.waitForDeployment();

  const address = await triviaGame.getAddress();
  console.log("TriviaGame deployed to:", address);
  console.log("Save this address — you'll need it for the frontend and backend!");
}

main().catch((error) => {
  console.error("DEPLOYMENT FAILED:", error.message, error.stack);
  process.exitCode = 1;
});