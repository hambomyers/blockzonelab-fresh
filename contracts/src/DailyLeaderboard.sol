// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DailyLeaderboard
 * @dev Manages daily leaderboard with free games and unlimited daily passes
 * @author BlockZone Lab
 */
contract DailyLeaderboard is Ownable, Pausable, ReentrancyGuard {
    IERC20 public usdcToken;
    
    // Pricing constants (in USDC.E with 6 decimals)
    uint256 public constant INDIVIDUAL_GAME_PRICE = 250000; // $0.25
    uint256 public constant UNLIMITED_DAILY_PRICE = 2500000; // $2.50
    uint256 public constant PLATFORM_FEE_PERCENT = 10; // 10% platform fee
    
    // Prize distribution constants
    uint256 public constant FIRST_PLACE_PERCENT = 30; // 30% to first place
    uint256 public constant DECAY_FACTOR = 600; // 0.6 * 1000 for precision
    uint256 public constant MINIMUM_PRIZE = 500000; // $0.50 minimum prize
    
    // Daily reset time (11 PM EST = 4 AM UTC next day)
    uint256 public constant DAILY_RESET_HOUR = 4; // UTC hour for daily reset
    
    // Player state tracking
    struct PlayerState {
        uint256 lastFreeGameDay; // Last day they used free game
        uint256 unlimitedPassExpiry; // Timestamp when unlimited pass expires
        uint256 totalGamesPlayed; // Total games played
        uint256 totalScore; // Total score accumulated
        bool hasUnlimitedPass; // Whether they have active unlimited pass
    }
    
    // Leaderboard entry
    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        string displayName;
    }
    
    // Prize distribution entry
    struct PrizeDistribution {
        address player;
        uint256 prizeAmount;
        uint256 rank;
    }
    
    // State variables
    mapping(address => PlayerState) public playerStates;
    mapping(uint256 => LeaderboardEntry[]) public dailyLeaderboards; // day => entries
    mapping(uint256 => mapping(address => bool)) public dailySubmissions; // day => player => submitted
    mapping(uint256 => uint256) public dailyPrizePools; // day => total prize pool
    mapping(uint256 => PrizeDistribution[]) public dailyPrizeDistributions; // day => prize distributions
    mapping(uint256 => bool) public dailyPrizesDistributed; // day => whether prizes distributed
    
    // Events
    event FreeGameUsed(address indexed player, uint256 day);
    event UnlimitedPassPurchased(address indexed player, uint256 expiry);
    event IndividualGamePurchased(address indexed player, uint256 price);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 day);
    event DailyReset(uint256 day);
    event PrizesDistributed(uint256 day, uint256 totalPool, uint256 totalDistributed, uint256 rollover);
    event PrizeAwarded(address indexed player, uint256 amount, uint256 rank, uint256 day);
    
    // Platform fee wallet
    address public platformFeeWallet;
    
    constructor(address _usdcToken, address _platformFeeWallet) {
        usdcToken = IERC20(_usdcToken);
        platformFeeWallet = _platformFeeWallet;
    }
    
    /**
     * @dev Get current day (based on 11 PM EST reset)
     */
    function getCurrentDay() public view returns (uint256) {
        // Convert to EST (UTC-5) and get day
        uint256 estTime = block.timestamp - 5 hours;
        return estTime / 1 days;
    }
    
    /**
     * @dev Check if player can play free game today
     */
    function canPlayFreeGame(address player) public view returns (bool) {
        uint256 currentDay = getCurrentDay();
        return playerStates[player].lastFreeGameDay < currentDay;
    }
    
    /**
     * @dev Check if player has unlimited pass active
     */
    function hasUnlimitedPass(address player) public view returns (bool) {
        return playerStates[player].hasUnlimitedPass && 
               playerStates[player].unlimitedPassExpiry > block.timestamp;
    }
    
    /**
     * @dev Use free game for the day
     */
    function useFreeGame() external whenNotPaused nonReentrant {
        require(canPlayFreeGame(msg.sender), "Free game already used today");
        
        uint256 currentDay = getCurrentDay();
        playerStates[msg.sender].lastFreeGameDay = currentDay;
        playerStates[msg.sender].totalGamesPlayed++;
        
        emit FreeGameUsed(msg.sender, currentDay);
    }
    
    /**
     * @dev Purchase unlimited daily pass
     */
    function purchaseUnlimitedPass() external whenNotPaused nonReentrant {
        require(!hasUnlimitedPass(msg.sender), "Already have unlimited pass");
        
        // Calculate expiry (next 11 PM EST)
        uint256 currentDay = getCurrentDay();
        uint256 expiry = (currentDay + 1) * 1 days + DAILY_RESET_HOUR * 1 hours;
        
        // Transfer payment
        uint256 feeAmount = (UNLIMITED_DAILY_PRICE * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = UNLIMITED_DAILY_PRICE - feeAmount;
        
        require(usdcToken.transferFrom(msg.sender, address(this), UNLIMITED_DAILY_PRICE), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        // Add net amount to prize pool
        dailyPrizePools[currentDay] += netAmount;
        
        // Update player state
        playerStates[msg.sender].hasUnlimitedPass = true;
        playerStates[msg.sender].unlimitedPassExpiry = expiry;
        playerStates[msg.sender].totalGamesPlayed++;
        
        emit UnlimitedPassPurchased(msg.sender, expiry);
    }
    
    /**
     * @dev Purchase individual game
     */
    function purchaseIndividualGame() external whenNotPaused nonReentrant {
        require(!hasUnlimitedPass(msg.sender), "Have unlimited pass active");
        
        // Calculate fees
        uint256 feeAmount = (INDIVIDUAL_GAME_PRICE * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = INDIVIDUAL_GAME_PRICE - feeAmount;
        
        require(usdcToken.transferFrom(msg.sender, address(this), INDIVIDUAL_GAME_PRICE), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        // Add net amount to prize pool
        uint256 currentDay = getCurrentDay();
        dailyPrizePools[currentDay] += netAmount;
        
        // Update player state
        playerStates[msg.sender].totalGamesPlayed++;
        
        emit IndividualGamePurchased(msg.sender, INDIVIDUAL_GAME_PRICE);
    }
    
    /**
     * @dev Submit score to daily leaderboard
     */
    function submitScore(uint256 score, string memory displayName) external whenNotPaused {
        uint256 currentDay = getCurrentDay();
        
        // Check if player can submit (has played today)
        require(canPlayFreeGame(msg.sender) || hasUnlimitedPass(msg.sender) || 
                playerStates[msg.sender].totalGamesPlayed > 0, "Must play game first");
        
        // Check if already submitted today
        require(!dailySubmissions[currentDay][msg.sender], "Already submitted today");
        
        // Add to leaderboard
        dailyLeaderboards[currentDay].push(LeaderboardEntry({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            displayName: displayName
        }));
        
        // Mark as submitted
        dailySubmissions[currentDay][msg.sender] = true;
        
        // Update total score
        playerStates[msg.sender].totalScore += score;
        
        emit ScoreSubmitted(msg.sender, score, currentDay);
    }
    
    /**
     * @dev Get daily leaderboard
     */
    function getDailyLeaderboard(uint256 day) external view returns (LeaderboardEntry[] memory) {
        return dailyLeaderboards[day];
    }
    
    /**
     * @dev Get current day leaderboard
     */
    function getCurrentLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return dailyLeaderboards[getCurrentDay()];
    }
    
    /**
     * @dev Get player state
     */
    function getPlayerState(address player) external view returns (PlayerState memory) {
        return playerStates[player];
    }
    
    /**
     * @dev Check if player can play (free game or unlimited pass)
     */
    function canPlay(address player) external view returns (bool) {
        return canPlayFreeGame(player) || hasUnlimitedPass(player);
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
     * @dev Update platform fee wallet
     */
    function setPlatformFeeWallet(address _newWallet) external onlyOwner {
        platformFeeWallet = _newWallet;
    }
    
    /**
     * @dev Emergency withdraw USDC.E
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        usdcToken.transfer(owner(), balance);
    }
    
    /**
     * @dev Calculate prize distribution for a given day
     */
    function calculatePrizeDistribution(uint256 day) public view returns (PrizeDistribution[] memory) {
        require(dailyPrizePools[day] > 0, "No prize pool for this day");
        require(!dailyPrizesDistributed[day], "Prizes already distributed");
        
        uint256 totalPool = dailyPrizePools[day];
        uint256 availablePool = totalPool - (totalPool * PLATFORM_FEE_PERCENT / 100);
        
        // Sort leaderboard by score (highest first)
        LeaderboardEntry[] memory entries = dailyLeaderboards[day];
        if (entries.length == 0) {
            return new PrizeDistribution[](0);
        }
        
        // Sort entries by score (bubble sort for simplicity)
        for (uint256 i = 0; i < entries.length - 1; i++) {
            for (uint256 j = 0; j < entries.length - i - 1; j++) {
                if (entries[j].score < entries[j + 1].score) {
                    LeaderboardEntry memory temp = entries[j];
                    entries[j] = entries[j + 1];
                    entries[j + 1] = temp;
                }
            }
        }
        
        // Calculate prizes using hyperbolic decay
        uint256 currentPrize = (availablePool * FIRST_PLACE_PERCENT) / 100;
        uint256 distributed = 0;
        uint256 winnerCount = 0;
        
        // Pre-calculate how many winners we can have
        uint256 tempPrize = currentPrize;
        uint256 tempDistributed = 0;
        uint256 tempWinnerCount = 0;
        
        while (tempPrize >= MINIMUM_PRIZE && tempDistributed < availablePool) {
            tempDistributed += tempPrize;
            tempWinnerCount++;
            tempPrize = (tempPrize * DECAY_FACTOR) / 1000;
        }
        
        // Create prize distribution array
        PrizeDistribution[] memory distribution = new PrizeDistribution[](tempWinnerCount);
        
        // Reset for actual distribution
        currentPrize = (availablePool * FIRST_PLACE_PERCENT) / 100;
        distributed = 0;
        winnerCount = 0;
        
        while (currentPrize >= MINIMUM_PRIZE && distributed < availablePool && winnerCount < entries.length) {
            distribution[winnerCount] = PrizeDistribution({
                player: entries[winnerCount].player,
                prizeAmount: currentPrize,
                rank: winnerCount + 1
            });
            
            distributed += currentPrize;
            winnerCount++;
            currentPrize = (currentPrize * DECAY_FACTOR) / 1000;
        }
        
        return distribution;
    }
    
    /**
     * @dev Distribute prizes for a given day
     */
    function distributePrizes(uint256 day) external onlyOwner {
        require(dailyPrizePools[day] > 0, "No prize pool for this day");
        require(!dailyPrizesDistributed[day], "Prizes already distributed");
        
        uint256 totalPool = dailyPrizePools[day];
        uint256 availablePool = totalPool - (totalPool * PLATFORM_FEE_PERCENT / 100);
        
        // Calculate distribution
        PrizeDistribution[] memory distribution = calculatePrizeDistribution(day);
        
        uint256 totalDistributed = 0;
        
        // Distribute prizes
        for (uint256 i = 0; i < distribution.length; i++) {
            if (distribution[i].prizeAmount > 0) {
                require(usdcToken.transfer(distribution[i].player, distribution[i].prizeAmount), "Prize transfer failed");
                totalDistributed += distribution[i].prizeAmount;
                
                emit PrizeAwarded(distribution[i].player, distribution[i].prizeAmount, distribution[i].rank, day);
            }
        }
        
        // Store distribution
        dailyPrizeDistributions[day] = distribution;
        dailyPrizesDistributed[day] = true;
        
        // Calculate rollover
        uint256 rollover = availablePool - totalDistributed;
        
        // Add rollover to next day's pool
        if (rollover > 0) {
            dailyPrizePools[day + 1] += rollover;
        }
        
        emit PrizesDistributed(day, totalPool, totalDistributed, rollover);
    }
    
    /**
     * @dev Get prize distribution for a given day
     */
    function getPrizeDistribution(uint256 day) external view returns (PrizeDistribution[] memory) {
        return dailyPrizeDistributions[day];
    }
    
    /**
     * @dev Check if prizes have been distributed for a given day
     */
    function arePrizesDistributed(uint256 day) external view returns (bool) {
        return dailyPrizesDistributed[day];
    }
    
    /**
     * @dev Get current day's prize pool
     */
    function getCurrentPrizePool() external view returns (uint256) {
        return dailyPrizePools[getCurrentDay()];
    }
    
    /**
     * @dev Add to current day's prize pool (called when payments are made)
     */
    function addToPrizePool(uint256 amount) external {
        // Only allow calls from authorized contracts (PaymentProcessor, etc.)
        require(msg.sender == owner() || msg.sender == address(this), "Unauthorized");
        dailyPrizePools[getCurrentDay()] += amount;
    }
} 