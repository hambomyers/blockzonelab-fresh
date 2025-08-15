// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PaymentProcessor.sol";

/**
 * @title ChallengeManager
 * @dev Manages head-to-head challenges with viral game patterns
 * @author BlockZone Lab
 */
contract ChallengeManager is Ownable, Pausable, ReentrancyGuard {
    PaymentProcessor public paymentProcessor;
    
    // Challenge types
    enum ChallengeType { STANDARD, HIGH_ROLLER }
    
    // Challenge status
    enum ChallengeStatus { ACTIVE, COMPLETED, EXPIRED, CANCELLED, REFUNDED }
    
    // Challenge structure
    struct Challenge {
        uint256 id;
        address creator;
        address challenger;
        ChallengeType challengeType;
        uint256 entryFee;
        uint256 creatorScore;
        uint256 challengerScore;
        uint256 creatorScoreTarget;
        string gamePattern; // Game pieces/pattern to replicate
        string message;
        ChallengeStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 completedAt;
        address winner;
    }
    
    // Challenge amounts (USDC.E has 6 decimals)
    uint256 public constant STANDARD_CHALLENGE_AMOUNT = 2000000; // $2.00 in USDC.E
    uint256 public constant HIGH_ROLLER_CHALLENGE_AMOUNT = 5000000; // $5.00 in USDC.E
    
    // Challenge expiry time (7 days)
    uint256 public constant CHALLENGE_EXPIRY_TIME = 7 days;
    
    // Platform fee percentage (10%)
    uint256 public constant PLATFORM_FEE_PERCENT = 10;
    
    // State variables
    mapping(uint256 => Challenge) public challenges;
    mapping(address => uint256[]) public userChallenges; // user => challenge IDs
    uint256 public nextChallengeId;
    
    // Events
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed creator,
        ChallengeType challengeType,
        uint256 entryFee,
        string gamePattern,
        string message
    );
    
    event ChallengeAccepted(
        uint256 indexed challengeId,
        address indexed challenger
    );
    
    event ChallengeCompleted(
        uint256 indexed challengeId,
        address indexed winner,
        uint256 winnerScore,
        uint256 prizeAmount
    );
    
    event ChallengeExpired(uint256 indexed challengeId);
    event ChallengeRefunded(uint256 indexed challengeId, address indexed creator, uint256 refundAmount);
    
    constructor(address _paymentProcessor) {
        paymentProcessor = PaymentProcessor(_paymentProcessor);
    }
    
    /**
     * @dev Create a new challenge
     */
    function createChallenge(
        ChallengeType challengeType,
        uint256 creatorScore,
        string memory gamePattern,
        string memory message
    ) external whenNotPaused nonReentrant returns (uint256) {
        uint256 entryFee = challengeType == ChallengeType.STANDARD ? 
            STANDARD_CHALLENGE_AMOUNT : HIGH_ROLLER_CHALLENGE_AMOUNT;
        
        // Process payment - creator pays upfront
        if (challengeType == ChallengeType.STANDARD) {
            paymentProcessor.processStandardChallengePayment(msg.sender);
        } else {
            paymentProcessor.processHighRollerChallengePayment(msg.sender);
        }
        
        uint256 challengeId = nextChallengeId++;
        
        challenges[challengeId] = Challenge({
            id: challengeId,
            creator: msg.sender,
            challenger: address(0),
            challengeType: challengeType,
            entryFee: entryFee,
            creatorScore: creatorScore,
            challengerScore: 0,
            creatorScoreTarget: creatorScore,
            gamePattern: gamePattern,
            message: message,
            status: ChallengeStatus.ACTIVE,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + CHALLENGE_EXPIRY_TIME,
            completedAt: 0,
            winner: address(0)
        });
        
        userChallenges[msg.sender].push(challengeId);
        
        emit ChallengeCreated(challengeId, msg.sender, challengeType, entryFee, gamePattern, message);
        
        return challengeId;
    }
    
    /**
     * @dev Accept a challenge
     */
    function acceptChallenge(uint256 challengeId) external whenNotPaused nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        
        require(challenge.status == ChallengeStatus.ACTIVE, "Challenge not active");
        require(challenge.creator != msg.sender, "Cannot challenge yourself");
        require(challenge.challenger == address(0), "Challenge already accepted");
        require(block.timestamp < challenge.expiresAt, "Challenge expired");
        
        // Process payment - challenger pays matching amount
        if (challenge.challengeType == ChallengeType.STANDARD) {
            paymentProcessor.processStandardChallengePayment(msg.sender);
        } else {
            paymentProcessor.processHighRollerChallengePayment(msg.sender);
        }
        
        challenge.challenger = msg.sender;
        userChallenges[msg.sender].push(challengeId);
        
        emit ChallengeAccepted(challengeId, msg.sender);
    }
    
    /**
     * @dev Submit challenger score and complete challenge
     */
    function completeChallenge(uint256 challengeId, uint256 challengerScore) 
        external whenNotPaused nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        
        require(challenge.status == ChallengeStatus.ACTIVE, "Challenge not active");
        require(challenge.challenger == msg.sender, "Only challenger can complete");
        require(block.timestamp < challenge.expiresAt, "Challenge expired");
        
        challenge.challengerScore = challengerScore;
        challenge.status = ChallengeStatus.COMPLETED;
        challenge.completedAt = block.timestamp;
        
        // Determine winner
        address winner;
        uint256 prizeAmount;
        
        if (challengerScore > challenge.creatorScore) {
            winner = msg.sender;
            prizeAmount = (challenge.entryFee * 2 * (100 - PLATFORM_FEE_PERCENT)) / 100;
        } else if (challengerScore < challenge.creatorScore) {
            winner = challenge.creator;
            prizeAmount = (challenge.entryFee * 2 * (100 - PLATFORM_FEE_PERCENT)) / 100;
        } else {
            // Tie - split prize
            winner = address(0); // No single winner
            prizeAmount = (challenge.entryFee * 2 * (100 - PLATFORM_FEE_PERCENT)) / 100;
        }
        
        challenge.winner = winner;
        
        emit ChallengeCompleted(challengeId, winner, 
            winner == msg.sender ? challengerScore : challenge.creatorScore, 
            prizeAmount);
    }
    
    /**
     * @dev Get challenge details
     */
    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }
    
    /**
     * @dev Get user's challenges
     */
    function getUserChallenges(address user) external view returns (uint256[] memory) {
        return userChallenges[user];
    }
    
    /**
     * @dev Get active challenges
     */
    function getActiveChallenges() external view returns (uint256[] memory) {
        uint256[] memory activeChallenges = new uint256[](nextChallengeId);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < nextChallengeId; i++) {
            if (challenges[i].status == ChallengeStatus.ACTIVE) {
                activeChallenges[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeChallenges[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if challenge is expired
     */
    function isChallengeExpired(uint256 challengeId) external view returns (bool) {
        return challenges[challengeId].expiresAt < block.timestamp;
    }
    
    /**
     * @dev Cancel expired challenges
     */
    function cancelExpiredChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        
        require(challenge.status == ChallengeStatus.ACTIVE, "Challenge not active");
        require(block.timestamp >= challenge.expiresAt, "Challenge not expired");
        
        challenge.status = ChallengeStatus.EXPIRED;
        
        emit ChallengeExpired(challengeId);
    }
    
    /**
     * @dev Refund expired challenge to creator
     */
    function refundExpiredChallenge(uint256 challengeId) external whenNotPaused nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        
        require(challenge.status == ChallengeStatus.EXPIRED, "Challenge not expired");
        require(challenge.creator == msg.sender, "Only creator can refund");
        require(challenge.challenger == address(0), "Challenge was accepted");
        
        // Refund the creator's entry fee
        uint256 refundAmount = challenge.entryFee;
        challenge.status = ChallengeStatus.REFUNDED;
        
        // Transfer refund to creator
        paymentProcessor.refundChallengePayment(msg.sender, refundAmount);
        
        emit ChallengeRefunded(challengeId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Get challenge prize amount
     */
    function getChallengePrize(uint256 challengeId) external view returns (uint256) {
        Challenge storage challenge = challenges[challengeId];
        return (challenge.entryFee * 2 * (100 - PLATFORM_FEE_PERCENT)) / 100;
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Update payment processor
     */
    function setPaymentProcessor(address _newProcessor) external onlyOwner {
        paymentProcessor = PaymentProcessor(_newProcessor);
    }
} 