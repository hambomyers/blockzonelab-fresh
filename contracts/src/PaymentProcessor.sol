// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentProcessor
 * @dev Handles USDC.E payments for daily leaderboard and challenges
 * @author BlockZone Lab
 */
contract PaymentProcessor is Ownable, Pausable, ReentrancyGuard {
    // USDC.E token contract
    IERC20 public usdcToken;
    
    // Platform fee wallet
    address public platformFeeWallet;
    
    // Platform fee percentage (10%)
    uint256 public constant PLATFORM_FEE_PERCENT = 10;
    
    // Payment amounts (in USDC.E with 6 decimals)
    uint256 public constant INDIVIDUAL_GAME_AMOUNT = 250000; // $0.25
    uint256 public constant UNLIMITED_DAILY_AMOUNT = 2500000; // $2.50
    uint256 public constant STANDARD_CHALLENGE_AMOUNT = 2000000; // $2.00
    uint256 public constant HIGH_ROLLER_CHALLENGE_AMOUNT = 5000000; // $5.00
    
    // Events
    event PaymentProcessed(
        address indexed payer,
        uint256 amount,
        string paymentType,
        uint256 platformFee
    );
    
    event ChallengeRefundProcessed(
        address indexed recipient,
        uint256 amount,
        uint256 indexed challengeId
    );
    
    event PlatformFeeWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    constructor(address _usdcToken, address _platformFeeWallet) {
        usdcToken = IERC20(_usdcToken);
        platformFeeWallet = _platformFeeWallet;
    }
    
    /**
     * @dev Process individual game payment
     */
    function processIndividualGamePayment(address payer) external whenNotPaused nonReentrant {
        uint256 feeAmount = (INDIVIDUAL_GAME_AMOUNT * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = INDIVIDUAL_GAME_AMOUNT - feeAmount;
        
        require(usdcToken.transferFrom(payer, address(this), INDIVIDUAL_GAME_AMOUNT), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        emit PaymentProcessed(payer, INDIVIDUAL_GAME_AMOUNT, "individual_game", feeAmount);
    }
    
    /**
     * @dev Process unlimited daily pass payment
     */
    function processUnlimitedDailyPayment(address payer) external whenNotPaused nonReentrant {
        uint256 feeAmount = (UNLIMITED_DAILY_AMOUNT * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = UNLIMITED_DAILY_AMOUNT - feeAmount;
        
        require(usdcToken.transferFrom(payer, address(this), UNLIMITED_DAILY_AMOUNT), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        emit PaymentProcessed(payer, UNLIMITED_DAILY_AMOUNT, "unlimited_daily", feeAmount);
    }
    
    /**
     * @dev Process standard challenge payment ($2)
     */
    function processStandardChallengePayment(address payer) external whenNotPaused nonReentrant {
        uint256 feeAmount = (STANDARD_CHALLENGE_AMOUNT * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = STANDARD_CHALLENGE_AMOUNT - feeAmount;
        
        require(usdcToken.transferFrom(payer, address(this), STANDARD_CHALLENGE_AMOUNT), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        emit PaymentProcessed(payer, STANDARD_CHALLENGE_AMOUNT, "standard_challenge", feeAmount);
    }
    
    /**
     * @dev Process high roller challenge payment
     */
    function processHighRollerChallengePayment(address payer) external whenNotPaused nonReentrant {
        uint256 feeAmount = (HIGH_ROLLER_CHALLENGE_AMOUNT * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = HIGH_ROLLER_CHALLENGE_AMOUNT - feeAmount;
        
        require(usdcToken.transferFrom(payer, address(this), HIGH_ROLLER_CHALLENGE_AMOUNT), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        emit PaymentProcessed(payer, HIGH_ROLLER_CHALLENGE_AMOUNT, "high_roller_challenge", feeAmount);
    }
    
    /**
     * @dev Process custom payment amount
     */
    function processCustomPayment(address payer, uint256 amount, string memory paymentType) 
        external whenNotPaused nonReentrant {
        uint256 feeAmount = (amount * PLATFORM_FEE_PERCENT) / 100;
        uint256 netAmount = amount - feeAmount;
        
        require(usdcToken.transferFrom(payer, address(this), amount), "Payment failed");
        
        // Transfer platform fee
        usdcToken.transfer(platformFeeWallet, feeAmount);
        
        emit PaymentProcessed(payer, amount, paymentType, feeAmount);
    }
    
    /**
     * @dev Get platform fee for a given amount
     */
    function getPlatformFee(uint256 amount) external pure returns (uint256) {
        return (amount * PLATFORM_FEE_PERCENT) / 100;
    }
    
    /**
     * @dev Get net amount after platform fee
     */
    function getNetAmount(uint256 amount) external pure returns (uint256) {
        return amount - ((amount * PLATFORM_FEE_PERCENT) / 100);
    }
    
    /**
     * @dev Update platform fee wallet
     */
    function setPlatformFeeWallet(address _newWallet) external onlyOwner {
        address oldWallet = platformFeeWallet;
        platformFeeWallet = _newWallet;
        emit PlatformFeeWalletUpdated(oldWallet, _newWallet);
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
     * @dev Emergency withdraw USDC.E
     */
    function emergencyWithdrawUSDC() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        usdcToken.transfer(owner(), balance);
    }
    
    /**
     * @dev Refund challenge payment to creator
     */
    function refundChallengePayment(address recipient, uint256 amount) external whenNotPaused nonReentrant {
        // Only allow refunds from authorized contracts (like ChallengeManager)
        require(msg.sender == owner() || msg.sender == address(this), "Unauthorized refund");
        
        require(usdcToken.transfer(recipient, amount), "Refund failed");
        
        emit ChallengeRefundProcessed(recipient, amount, 0); // challengeId 0 for general refunds
    }
    
    /**
     * @dev Get contract USDC.E balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
} 