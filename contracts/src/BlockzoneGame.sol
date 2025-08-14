// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DailyLeaderboard.sol";
import "./ChallengeManager.sol";

/**
 * @title BlockzoneGame
 * @dev Main gaming contract that coordinates daily leaderboard and challenges
 * @author BlockZone Lab
 */
contract BlockzoneGame {
    IERC20 public usdcToken;
    DailyLeaderboard public dailyLeaderboard;
    ChallengeManager public challengeManager;
    
    // Platform fee wallet
    address public platformFeeWallet;
    
    // Events
    event GamePlayed(address indexed player, uint256 score, string gameType);
    event ChallengeCreated(address indexed creator, uint256 challengeId);
    event ChallengeAccepted(address indexed challenger, uint256 challengeId);
    
    constructor(
        address _usdcToken,
        address _dailyLeaderboardAddress,
        address _challengeManagerAddress,
        address _platformFeeWallet
    ) {
        usdcToken = IERC20(_usdcToken);
        dailyLeaderboard = DailyLeaderboard(_dailyLeaderboardAddress);
        challengeManager = ChallengeManager(_challengeManagerAddress);
        platformFeeWallet = _platformFeeWallet;
    }
    
    /**
     * @dev Play a free game
     */
    function playFreeGame() external {
        dailyLeaderboard.useFreeGame();
        emit GamePlayed(msg.sender, 0, "free_game");
    }
    
    /**
     * @dev Purchase unlimited daily pass
     */
    function purchaseUnlimitedDailyPass() external {
        dailyLeaderboard.purchaseUnlimitedPass();
        emit GamePlayed(msg.sender, 0, "unlimited_pass");
    }
    
    /**
     * @dev Purchase individual game
     */
    function purchaseIndividualGame() external {
        dailyLeaderboard.purchaseIndividualGame();
        emit GamePlayed(msg.sender, 0, "individual_game");
    }
    
    /**
     * @dev Submit score to daily leaderboard
     */
    function submitScore(uint256 score, string memory displayName) external {
        dailyLeaderboard.submitScore(score, displayName);
        emit GamePlayed(msg.sender, score, "score_submission");
    }
    
    /**
     * @dev Create a quick challenge
     */
    function createQuickChallenge(
        uint256 creatorScore,
        string memory gamePattern,
        string memory message
    ) external returns (uint256) {
        uint256 challengeId = challengeManager.createChallenge(
            ChallengeManager.ChallengeType.QUICK,
            creatorScore,
            gamePattern,
            message
        );
        
        emit ChallengeCreated(msg.sender, challengeId);
        return challengeId;
    }
    
    /**
     * @dev Create a high roller challenge
     */
    function createHighRollerChallenge(
        uint256 creatorScore,
        string memory gamePattern,
        string memory message
    ) external returns (uint256) {
        uint256 challengeId = challengeManager.createChallenge(
            ChallengeManager.ChallengeType.HIGH_ROLLER,
            creatorScore,
            gamePattern,
            message
        );
        
        emit ChallengeCreated(msg.sender, challengeId);
        return challengeId;
    }
    
    /**
     * @dev Accept a challenge
     */
    function acceptChallenge(uint256 challengeId) external {
        challengeManager.acceptChallenge(challengeId);
        emit ChallengeAccepted(msg.sender, challengeId);
    }
    
    /**
     * @dev Complete a challenge
     */
    function completeChallenge(uint256 challengeId, uint256 challengerScore) external {
        challengeManager.completeChallenge(challengeId, challengerScore);
    }
    
    /**
     * @dev Get player state
     */
    function getPlayerState(address player) external view returns (DailyLeaderboard.PlayerState memory) {
        return dailyLeaderboard.getPlayerState(player);
    }
    
    /**
     * @dev Get current leaderboard
     */
    function getCurrentLeaderboard() external view returns (DailyLeaderboard.LeaderboardEntry[] memory) {
        return dailyLeaderboard.getCurrentLeaderboard();
    }
    
    /**
     * @dev Check if player can play
     */
    function canPlay(address player) external view returns (bool) {
        return dailyLeaderboard.canPlay(player);
    }
    
    /**
     * @dev Get USDC.E balance of contract
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}
