require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 5042002
    }
  }
};