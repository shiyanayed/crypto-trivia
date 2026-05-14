// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract TriviaGame is ERC721 {
    // Simple counter replacing deprecated Counters.sol
    uint256 private _tokenIds;
    uint public constant PASS_SCORE = 7;
    uint public constant TOTAL_QUESTIONS = 10;
    mapping(address => uint) public playerScores;
    mapping(address => bool) public hasMinted;
    string public badgeURI;
    struct LeaderboardEntry {
        address player;
        uint score;
        bool hasBadge;
    }
    address[] public allPlayers;
    mapping(address => bool) public isPlayer;
    event ScoreRecorded(address player, uint score);
    event BadgeMinted(address player, uint tokenId);
    constructor(string memory _badgeURI) ERC721("CryptoTriviaBadge", "CTB") {
        badgeURI = _badgeURI;
    }
    function recordScore(address player, uint score) external {
        require(score <= TOTAL_QUESTIONS, "Invalid score");
        if (score > playerScores[player]) {
            playerScores[player] = score;
        }
        if (!isPlayer[player]) {
            isPlayer[player] = true;
            allPlayers.push(player);
        }
        emit ScoreRecorded(player, score);
    }
    function mintBadge() external {
        require(playerScores[msg.sender] >= PASS_SCORE, "Score too low to mint");
        require(!hasMinted[msg.sender], "Already minted");
        // Increment first, then use — avoids tokenId 0
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(msg.sender, newTokenId);
        hasMinted[msg.sender] = true;
        emit BadgeMinted(msg.sender, newTokenId);
    }
    function tokenURI(uint256) public view override returns (string memory) {
        return badgeURI;
    }
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
        // Bubble sort by score descending
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
    function getTotalPlayers() external view returns (uint) {
        return allPlayers.length;
    }
} 