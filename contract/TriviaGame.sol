// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ERC721 standard from OpenZeppelin for NFT functionality
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TriviaGame is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Passing score to qualify for NFT badge
    uint public constant PASS_SCORE = 7;
    uint public constant TOTAL_QUESTIONS = 10;

    // Stores each player's best score
    mapping(address => uint) public playerScores;

    // Tracks if wallet already minted badge
    mapping(address => bool) public hasMinted;

    // NFT badge image stored on IPFS via Pinata
    string public badgeURI;

    // Leaderboard entry structure
    struct LeaderboardEntry {
        address player;
        uint score;
        bool hasBadge;
    }

    // Array to track all players
    address[] public allPlayers;
    mapping(address => bool) public isPlayer;

    // Events (these create on-chain activity logs)
    event ScoreRecorded(address player, uint score);
    event BadgeMinted(address player, uint tokenId);

    constructor(string memory _badgeURI) ERC721("CryptoTriviaBadge", "CTB") {
        badgeURI = _badgeURI;
    }

    // Called by backend after player finishes quiz
    function recordScore(address player, uint score) external {
        require(score <= TOTAL_QUESTIONS, "Invalid score");

        // Only update if new score is better
        if (score > playerScores[player]) {
            playerScores[player] = score;
        }

        // Add to players list if first time
        if (!isPlayer[player]) {
            isPlayer[player] = true;
            allPlayers.push(player);
        }

        emit ScoreRecorded(player, score);
    }

    // Player mints their NFT badge if they passed
    function mintBadge() external {
        require(playerScores[msg.sender] >= PASS_SCORE, "Score too low to mint");
        require(!hasMinted[msg.sender], "Already minted");

        _tokenIds.increment();
        uint newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        hasMinted[msg.sender] = true;

        emit BadgeMinted(msg.sender, newTokenId);
    }

    // Returns badge image URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return badgeURI;
    }

    // Returns full leaderboard sorted by score
    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        uint len = allPlayers.length;
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](len);

        for (uint i = 0; i < len; i++) {
            address p = allPlayers[i];
            entries[i] = LeaderboardEntry({
                player: p,
                score: playerScores[p],
                hasBadge: hasMinted[p]
            });
        }

        // Simple sort by score (highest first)
        for (uint i = 0; i < len; i++) {
            for (uint j = i + 1; j < len; j++) {
                if (entries[j].score > entries[i].score) {
                    LeaderboardEntry memory temp = entries[i];
                    entries[i] = entries[j];
                    entries[j] = temp;
                }
            }
        }

        return entries;
    }

    // Returns total number of players
    function getTotalPlayers() external view returns (uint) {
        return allPlayers.length;
    }
}