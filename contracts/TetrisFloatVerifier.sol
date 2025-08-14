// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * TetrisFloatVerifier - Sonic Labs Smart Contract for NeonDrop FLOAT Piece Verification
 * 
 * This contract provides on-chain verification of quantum-enhanced FLOAT piece generation
 * in the NeonDrop Tetris game. It ensures perfect determinism and prevents cheating by
 * validating that FLOAT pieces are generated according to the quantum probability system.
 * 
 * Key Features:
 * - Daily seed verification and storage
 * - Quantum probability calculation matching JavaScript implementation
 * - Deterministic FLOAT piece generation verification
 * - Anti-cheat protection through blockchain immutability
 * - Integration with NeonDrop's existing architecture
 */

contract TetrisFloatVerifier {
    // Game state structure for tracking player progress
    struct GameState {
        uint256 dailySeed;              // Daily seed for deterministic generation
        uint256 frameNumber;            // Current frame/piece number
        uint256 floatPiecesGenerated;   // Total FLOAT pieces generated
        uint256 totalPiecesGenerated;   // Total pieces generated
        bytes32 boardStateHash;         // Hash of current board state
        uint256 lastVerificationTime;   // Timestamp of last verification
        bool isActive;                  // Whether game is currently active
    }
    
    // Events for tracking and analytics
    event GameStarted(
        address indexed player,
        string date,
        uint256 dailySeed,
        uint256 timestamp
    );
    
    event FloatPieceVerified(
        address indexed player,
        uint256 frameNumber,
        uint256 stackHeight,
        uint256 probability,
        bool wasFloat,
        uint256 timestamp
    );
    
    event GameCompleted(
        address indexed player,
        uint256 finalScore,
        uint256 totalFloats,
        uint256 totalPieces,
        uint256 timestamp
    );
    
    // Storage mappings
    mapping(address => GameState) public games;           // Player game states
    mapping(string => uint256) public dailySeeds;         // Date => seed mapping
    mapping(address => uint256) public playerScores;      // Player high scores
    mapping(string => address[]) public dailyPlayers;     // Date => players list
    
    // Contract configuration
    address public owner;
    uint256 public constant MAX_STACK_HEIGHT = 20;
    uint256 public constant BASE_PROBABILITY = 70;        // 7% in basis points (70/1000)
    uint256 public constant MEDIUM_PROBABILITY = 120;     // 12% in basis points
    uint256 public constant MAX_PROBABILITY = 230;        // 23% in basis points
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier gameActive() {
        require(games[msg.sender].isActive, "No active game");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * Start a new daily challenge game
     * @param date Date string in YYYY-MM-DD format
     */
    function startDailyChallenge(string memory date) external {
        // Generate deterministic seed from date (matching JavaScript implementation)
        uint256 seed = uint256(keccak256(abi.encodePacked(date))) & 0x7FFFFFFF;
        
        // Store daily seed if not already set
        if (dailySeeds[date] == 0) {
            dailySeeds[date] = seed;
        } else {
            // Use existing seed to ensure all players have same seed for the day
            seed = dailySeeds[date];
        }
        
        // Initialize player's game state
        games[msg.sender] = GameState({
            dailySeed: seed,
            frameNumber: 0,
            floatPiecesGenerated: 0,
            totalPiecesGenerated: 0,
            boardStateHash: keccak256(abi.encodePacked(seed, msg.sender)),
            lastVerificationTime: block.timestamp,
            isActive: true
        });
        
        // Add player to daily players list
        dailyPlayers[date].push(msg.sender);
        
        emit GameStarted(msg.sender, date, seed, block.timestamp);
    }
    
    /**
     * Verify FLOAT piece generation against quantum probability
     * @param frameNumber Current frame/piece number
     * @param stackHeight Current stack height (0-20)
     * @param wasFloat Whether a FLOAT piece was generated
     * @param boardStateHash Hash of current board state
     */
    function verifyFloatGeneration(
        uint256 frameNumber,
        uint256 stackHeight,
        bool wasFloat,
        bytes32 boardStateHash
    ) external gameActive {
        GameState storage game = games[msg.sender];
        
        // Validate frame sequence
        require(frameNumber > game.frameNumber, "Invalid frame sequence");
        require(stackHeight <= MAX_STACK_HEIGHT, "Invalid stack height");
        
        // Calculate quantum probability on-chain (simplified version)
        uint256 probability = calculateQuantumProbability(
            game.dailySeed,
            game.totalPiecesGenerated,
            stackHeight
        );
        
        // Generate deterministic roll using game state
        uint256 roll = uint256(keccak256(abi.encodePacked(
            game.dailySeed,
            game.totalPiecesGenerated,
            frameNumber,
            msg.sender
        ))) % 1000;
        
        // Verify FLOAT generation matches probability
        bool shouldBeFloat = roll < probability;
        require(wasFloat == shouldBeFloat, "FLOAT generation mismatch");
        
        // Update game state
        if (wasFloat) {
            game.floatPiecesGenerated++;
        }
        
        game.totalPiecesGenerated++;
        game.frameNumber = frameNumber;
        game.boardStateHash = boardStateHash;
        game.lastVerificationTime = block.timestamp;
        
        emit FloatPieceVerified(
            msg.sender,
            frameNumber,
            stackHeight,
            probability,
            wasFloat,
            block.timestamp
        );
    }
    
    /**
     * Calculate quantum probability matching JavaScript implementation
     * Simplified version for Solidity constraints
     * @param seed Daily seed
     * @param pieceCount Current piece count
     * @param stackHeight Current stack height
     * @return probability Probability in basis points (70-230 = 7%-23%)
     */
    function calculateQuantumProbability(
        uint256 seed,
        uint256 pieceCount,
        uint256 stackHeight
    ) public pure returns (uint256) {
        // Clamp stack height
        if (stackHeight > MAX_STACK_HEIGHT) {
            stackHeight = MAX_STACK_HEIGHT;
        }
        
        // Calculate base probability based on stack height thresholds
        uint256 targetProbability;
        if (stackHeight >= 15) {
            targetProbability = MAX_PROBABILITY;
        } else if (stackHeight >= 5) {
            // Linear interpolation between medium and max probability
            uint256 t = ((stackHeight - 5) * 1000) / 10; // Scale to 0-1000
            targetProbability = MEDIUM_PROBABILITY + 
                (t * (MAX_PROBABILITY - MEDIUM_PROBABILITY)) / 1000;
        } else {
            // Linear interpolation between base and medium probability
            uint256 t = (stackHeight * 1000) / 5; // Scale to 0-1000
            targetProbability = BASE_PROBABILITY + 
                (t * (MEDIUM_PROBABILITY - BASE_PROBABILITY)) / 1000;
        }
        
        // Add deterministic quantum variation (±2% = ±20 basis points)
        uint256 variation = (uint256(keccak256(abi.encode(seed, pieceCount))) % 40);
        if (variation >= 20) {
            variation = variation - 20; // 0-19 (positive variation)
            if (targetProbability + variation <= MAX_PROBABILITY) {
                targetProbability += variation;
            }
        } else {
            // 0-19 becomes negative variation
            if (targetProbability >= BASE_PROBABILITY + variation) {
                targetProbability -= variation;
            }
        }
        
        return targetProbability;
    }
    
    /**
     * Complete game and record final score
     * @param finalScore Final game score
     */
    function completeGame(uint256 finalScore) external gameActive {
        GameState storage game = games[msg.sender];
        
        // Update high score if necessary
        if (finalScore > playerScores[msg.sender]) {
            playerScores[msg.sender] = finalScore;
        }
        
        // Mark game as inactive
        game.isActive = false;
        
        emit GameCompleted(
            msg.sender,
            finalScore,
            game.floatPiecesGenerated,
            game.totalPiecesGenerated,
            block.timestamp
        );
    }
    
    /**
     * Get player's current game state
     */
    function getGameState(address player) external view returns (GameState memory) {
        return games[player];
    }
    
    /**
     * Get daily seed for a specific date
     */
    function getDailySeed(string memory date) external view returns (uint256) {
        return dailySeeds[date];
    }
    
    /**
     * Get player's high score
     */
    function getPlayerScore(address player) external view returns (uint256) {
        return playerScores[player];
    }
    
    /**
     * Get list of players for a specific date
     */
    function getDailyPlayers(string memory date) external view returns (address[] memory) {
        return dailyPlayers[date];
    }
    
    /**
     * Emergency function to reset a player's game state (owner only)
     */
    function resetPlayerGame(address player) external onlyOwner {
        games[player].isActive = false;
    }
    
    /**
     * Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalGamesStarted,
        uint256 totalVerifications,
        uint256 currentTimestamp
    ) {
        // Note: These would require additional storage to track accurately
        // For now, return basic info
        return (0, 0, block.timestamp);
    }
}
