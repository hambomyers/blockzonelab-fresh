/**
 * BlockZone Lab - Styled Leaderboard Display Component
 * Matches the neon drop game over screen styling
 * 
 * ENHANCED: Uses PlayerProfile as single source of truth for leaderboard data
 * OPTIMIZED: CSS extracted to head, DOM creation optimized
 */

import { PlayerProfile } from './PlayerProfile.js';

export class LeaderboardDisplay {
    constructor() {
        this.apiUrl = 'https://api.blockzonelab.com/api/leaderboard';
        this.isVisible = false;
        this.cssInjected = false;
        
        // Use singleton PlayerProfile to avoid multiple instances
        this.playerProfile = window.globalPlayerProfile || new PlayerProfile();
        if (!window.globalPlayerProfile) {
            window.globalPlayerProfile = this.playerProfile;
            // console.log('🏆 LeaderboardDisplay: Created global PlayerProfile singleton');
        } else {
            // console.log('🏆 LeaderboardDisplay: Using existing global PlayerProfile singleton');
        }
    }

    // PERFORMANCE OPTIMIZATION: Inject CSS once to head
    injectCSS() {
        if (this.cssInjected) return;
        
        const style = document.createElement('style');
        style.id = 'leaderboard-styles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes neonGlow { 
                0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
            }
            @keyframes scorePulse { 
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            @keyframes floatUp { 
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes chicletEntrance {
                0% { transform: translateY(-30px) scale(0.3) rotate(10deg); opacity: 0; }
                60% { transform: translateY(2px) scale(1.1) rotate(-3deg); opacity: 0.8; }
                100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
            }
            .neon-title { animation: neonGlow 2s ease-in-out infinite; }
            .score-display { animation: scorePulse 3s ease-in-out infinite; }
            .info-line { animation: floatUp 0.6s ease-out forwards; }
            .info-line:nth-child(1) { animation-delay: 0.1s; }
            .info-line:nth-child(2) { animation-delay: 0.2s; }
            .info-line:nth-child(3) { animation-delay: 0.3s; }
            .info-line:nth-child(4) { animation-delay: 0.4s; }
            .info-line:nth-child(5) { animation-delay: 0.5s; }
            .info-line:nth-child(6) { animation-delay: 0.6s; }
            .chiclet { animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .chiclet:nth-child(1) { animation-delay: 0.1s; }
            .chiclet:nth-child(2) { animation-delay: 0.2s; }
            .chiclet:nth-child(3) { animation-delay: 0.3s; }
            .chiclet:nth-child(4) { animation-delay: 0.4s; }
            .chiclet:nth-child(5) { animation-delay: 0.5s; }
            .chiclet:nth-child(6) { animation-delay: 0.6s; }
            .chiclet:nth-child(7) { animation-delay: 0.7s; }
            .chiclet:nth-child(8) { animation-delay: 0.8s; }
            .leaderboard-row { animation: floatUp 0.6s ease-out forwards; }
            .leaderboard-row:nth-child(1) { animation-delay: 0.1s; }
            .leaderboard-row:nth-child(2) { animation-delay: 0.2s; }
            .leaderboard-row:nth-child(3) { animation-delay: 0.3s; }
            .leaderboard-row:nth-child(4) { animation-delay: 0.4s; }
            .leaderboard-row:nth-child(5) { animation-delay: 0.5s; }
            .leaderboard-row:nth-child(6) { animation-delay: 0.6s; }
            .leaderboard-row:nth-child(7) { animation-delay: 0.7s; }
            .leaderboard-row:nth-child(8) { animation-delay: 0.8s; }
            .leaderboard-row:nth-child(9) { animation-delay: 0.9s; }
            .leaderboard-row:nth-child(10) { animation-delay: 1.0s; }
            
            .leaderboard-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000000;
                animation: fadeIn 0.5s ease-out;
            }

            .leaderboard-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 800px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 
                    0 20px 60px rgba(0, 212, 255, 0.3),
                    0 0 40px rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.2);
                color: white;
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes cardSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .title-section {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                padding-bottom: 25px;
            }

            .netflix-chiclet-title {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0px;
                margin-bottom: 15px;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
            }

            .chiclet-word {
                display: flex;
                gap: 0px;
            }

            .chiclet-spacer {
                width: 24px;
                height: 24px;
            }

            .chiclet {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Bungee', monospace;
                font-weight: bold;
                font-size: 28.8px;
                line-height: 1;
                border-radius: 3px;
                position: relative;
                text-align: center;
                text-shadow: 1px 1px 0 #000000;
                transform: translateY(-30px) scale(0.3);
                opacity: 0;
                transition: transform 0.3s ease;
            }

            .chiclet:hover {
                transform: translateY(0) scale(1.05);
            }

            .chiclet.neon {
                background: #FFFF00;
                color: transparent;
                box-shadow: 
                    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                    0 0 10px rgba(255, 255, 0, 0.5);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background: linear-gradient(135deg, #FFFF00 0%, #FFD700 50%, #FFA500 100%);
            }

            .chiclet.drop {
                background: #8A2BE2;
                color: transparent;
                box-shadow: 
                    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                    0 0 10px rgba(138, 43, 226, 0.5);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #DA70D6 100%);
            }

            .leaderboard-title {
                font-size: 36px;
                font-weight: bold;
                color: #00d4ff;
                text-shadow: 0 0 15px #00d4ff, 0 0 25px #00d4ff;
                margin-top: 20px;
            }

            .celebration-banner {
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
                border: 2px solid rgba(255, 215, 0, 0.5);
                animation: celebrationGlow 2s ease-in-out infinite alternate;
            }
            
            @keyframes celebrationGlow {
                from { box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3); }
                to { box-shadow: 0 8px 35px rgba(255, 215, 0, 0.6); }
            }
            
            .celebration-icon {
                font-size: 2.5em;
                animation: bounce 1s ease-in-out infinite;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .celebration-text {
                flex: 1;
            }
            
            .celebration-title {
                font-size: 1.2em;
                font-weight: bold;
                color: #8b4513;
                margin-bottom: 5px;
            }
            
            .celebration-subtitle {
                font-size: 0.9em;
                color: #a0522d;
            }
            
            .tournament-status {
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 50%, #00d4ff 100%);
                border-radius: 15px;
                padding: 15px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 5px 20px rgba(0, 212, 255, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.4);
            }
            
            .status-icon {
                font-size: 1.5em;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .status-text {
                color: white;
                font-weight: 500;
                font-size: 0.95em;
            }
            
            .tournament-info {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 12px;
            }

            .tournament-period {
                font-size: 24px;
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 8px;
            }

            .tournament-day {
                font-size: 18px;
                color: #ffffff;
                margin-bottom: 5px;
            }

            .tournament-reset {
                font-size: 14px;
                color: #cccccc;
            }

            .leaderboard-table {
                margin-bottom: 30px;
            }

            .table-header {
                display: grid;
                grid-template-columns: 80px 1fr 120px 80px;
                gap: 20px;
                padding: 15px 20px;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px;
                margin-bottom: 10px;
                font-weight: bold;
                color: #00d4ff;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .leaderboard-row {
                display: grid;
                grid-template-columns: 80px 1fr 120px 80px;
                gap: 20px;
                padding: 15px 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin-bottom: 8px;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
            }

            .leaderboard-row:hover {
                background: rgba(0, 212, 255, 0.1);
                border-color: rgba(0, 212, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
            }

            .leaderboard-row.rank-1 {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
                border-color: #ffd700;
            }

            .leaderboard-row.rank-2 {
                background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
                border-color: #c0c0c0;
            }

            .leaderboard-row.rank-3 {
                background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
                border-color: #cd7f32;
            }

            .rank-cell {
                font-weight: bold;
                font-size: 18px;
                color: #ffffff;
                display: flex;
                align-items: center;
            }

            .player-cell {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .player-name {
                font-weight: bold;
                font-size: 16px;
                color: #ffffff;
            }

            .player-id {
                font-size: 12px;
                color: #888888;
                font-family: 'Share Tech Mono', monospace;
            }

            .score-cell {
                font-weight: bold;
                font-size: 18px;
                color: #00d4ff;
                text-align: right;
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }

            .time-cell {
                font-size: 14px;
                color: #888888;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Share Tech Mono', monospace;
            }

            .leaderboard-stats {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
            }

            .total-players {
                font-size: 18px;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .last-updated {
                font-size: 14px;
                color: #888888;
            }

            .leaderboard-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .action-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-family: 'Inter', sans-serif;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                min-width: 120px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                position: relative;
                overflow: hidden;
            }

            .action-btn.primary {
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                color: #000;
                border: 2px solid #00d4ff;
            }

            .action-btn.primary:hover {
                background: linear-gradient(45deg, #00b8e6, #0077aa);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
            }

            .action-btn.secondary {
                background: linear-gradient(45deg, #666, #444);
                color: #fff;
                border: 2px solid #666;
            }

            .action-btn.secondary:hover {
                background: linear-gradient(45deg, #777, #555);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(136, 136, 136, 0.4);
            }

            .error-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 
                    0 20px 60px rgba(255, 68, 68, 0.3),
                    0 0 40px rgba(255, 68, 68, 0.1);
                border: 1px solid rgba(255, 68, 68, 0.2);
                color: white;
            }

            .error-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }

            .error-title {
                font-size: 24px;
                font-weight: bold;
                color: #ff4444;
                margin-bottom: 15px;
            }

            .error-message {
                font-size: 16px;
                color: #cccccc;
                margin-bottom: 25px;
                line-height: 1.5;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .leaderboard-container {
                    width: 95%;
                    padding: 30px 20px;
                    max-height: 90vh;
                }

                .table-header,
                .leaderboard-row {
                    grid-template-columns: 50px 1fr 70px 60px;
                    gap: 15px;
                    padding: 12px 15px;
                }

                .chiclet {
                    width: 20px;
                    height: 20px;
                    font-size: 24px;
                }

                .chiclet-spacer {
                    width: 20px;
                    height: 20px;
                }

                .leaderboard-title {
                    font-size: 28px;
                }

                .cycle-period {
                    font-size: 20px;
                }

                .cycle-time {
                    font-size: 16px;
                }

                .action-btn {
                    padding: 10px 20px;
                    font-size: 14px;
                    min-width: 100px;
                }
            }

            @media (max-width: 480px) {
                .leaderboard-container {
                    padding: 20px 15px;
                }

                .table-header,
                .leaderboard-row {
                    grid-template-columns: 40px 1fr 60px 50px;
                    gap: 10px;
                    padding: 10px 12px;
                }

                .chiclet {
                    width: 18px;
                    height: 18px;
                    font-size: 20px;
                }

                .chiclet-spacer {
                    width: 18px;
                    height: 18px;
                }

                .player-name {
                    font-size: 14px;
                }

                .player-id {
                    font-size: 10px;
                }

                .score-cell {
                    font-size: 16px;
                }

                .time-cell {
                    font-size: 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
        this.cssInjected = true;
    }

    async show() {
        if (this.isVisible) return;
        
        // console.log('🏆 LeaderboardDisplay.show() called');
        
        try {
            const data = await this.fetchLeaderboard();
            // console.log('🏆 Leaderboard data fetched:', data);
            this.createOverlay(data);
            this.isVisible = true;
            // console.log('🏆 Leaderboard overlay created and visible');
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showError('Failed to load leaderboard data');
        }
    }

    hide() {
        const overlay = document.getElementById('leaderboard-overlay');
        if (overlay) {
            overlay.remove();
            this.isVisible = false;
        }
    }

    async fetchLeaderboard() {
        // console.log('🏆 LeaderboardDisplay: Fetching leaderboard via PlayerProfile');
        
        try {
            // Use PlayerProfile as single source of truth instead of direct API call
            const data = await this.playerProfile.getLeaderboardData();
            
            // console.log('✅ Leaderboard data retrieved via PlayerProfile:', data);
            return data;
            
        } catch (error) {
            console.error('❌ LeaderboardDisplay: Failed to fetch leaderboard via PlayerProfile:', error);
            throw error;
        }
    }

    // PERFORMANCE OPTIMIZATION: Use DocumentFragment instead of innerHTML
    createOverlay(data) {
        // Inject CSS once to head
        this.injectCSS();
        
        const overlay = document.createElement('div');
        overlay.id = 'leaderboard-overlay';
        overlay.className = 'leaderboard-overlay';
        
        // Create content using DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Create container
        const container = document.createElement('div');
        container.className = 'leaderboard-container';
        
        // Create title section
        const titleSection = this.createTitleSection();
        container.appendChild(titleSection);
        
        // Create tournament info
        const tournamentInfo = this.createTournamentInfo(data);
        container.appendChild(tournamentInfo);
        
        // Create leaderboard table
        const leaderboardTable = this.createLeaderboardTable(data);
        container.appendChild(leaderboardTable);
        
        // Create stats
        const stats = this.createStats(data);
        container.appendChild(stats);
        
        // Create action buttons
        const actions = this.createActionButtons();
        container.appendChild(actions);
        
        fragment.appendChild(container);
        overlay.appendChild(fragment);
        document.body.appendChild(overlay);
        
        // Add event listeners
        this.addEventListeners();
    }

    createTitleSection() {
        const titleSection = document.createElement('div');
        titleSection.className = 'title-section';
        
        const chicletTitle = document.createElement('div');
        chicletTitle.className = 'netflix-chiclet-title';
        
        // NEON
        const neonWord = document.createElement('div');
        neonWord.className = 'chiclet-word';
        ['N', 'E', 'O', 'N'].forEach(letter => {
            const chiclet = document.createElement('div');
            chiclet.className = 'chiclet neon';
            chiclet.textContent = letter;
            neonWord.appendChild(chiclet);
        });
        
        const spacer = document.createElement('div');
        spacer.className = 'chiclet-spacer';
        
        // DROP
        const dropWord = document.createElement('div');
        dropWord.className = 'chiclet-word';
        ['D', 'R', 'O', 'P'].forEach(letter => {
            const chiclet = document.createElement('div');
            chiclet.className = 'chiclet drop';
            chiclet.textContent = letter;
            dropWord.appendChild(chiclet);
        });
        
        chicletTitle.appendChild(neonWord);
        chicletTitle.appendChild(spacer);
        chicletTitle.appendChild(dropWord);
        
        const leaderboardTitle = document.createElement('div');
        leaderboardTitle.className = 'leaderboard-title neon-title';
        leaderboardTitle.textContent = 'LEADERBOARD';
        
        titleSection.appendChild(chicletTitle);
        titleSection.appendChild(leaderboardTitle);
        
        return titleSection;
    }

    createTournamentInfo(data) {
        const tournamentInfo = document.createElement('div');
        tournamentInfo.className = 'tournament-info info-line';
        
        // Handle null data gracefully
        if (!data) {
            const noData = document.createElement('div');
            noData.className = 'no-data-message';
            noData.textContent = 'No tournament data available';
            noData.style.cssText = 'color: #888; font-style: italic; text-align: center; padding: 20px;';
            tournamentInfo.appendChild(noData);
            return tournamentInfo;
        }
        
        // Add tournament phase banner if available
        const phaseBanner = this.formatTournamentPhase(data);
        if (phaseBanner) {
            tournamentInfo.appendChild(phaseBanner);
        }
        
        const period = document.createElement('div');
        period.className = 'tournament-period';
        period.textContent = data.period === 'daily-tournament' ? 'Daily Tournament' : data.period;
        
        const day = document.createElement('div');
        day.className = 'tournament-day';
        day.textContent = `Day: ${data.tournament_day || 'Today'}`;
        
        const reset = document.createElement('div');
        reset.className = 'tournament-reset';
        reset.textContent = `Next Tournament: ${this.formatResetTime(data.next_reset, data.next_tournament_date)}`;
        
        tournamentInfo.appendChild(period);
        tournamentInfo.appendChild(day);
        tournamentInfo.appendChild(reset);
        
        return tournamentInfo;
    }

    createLeaderboardTable(data) {
        const table = document.createElement('div');
        table.className = 'leaderboard-table';
        
        // Handle null data gracefully
        if (!data || !data.scores || data.scores.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'no-data-message';
            noData.textContent = 'No leaderboard data available';
            noData.style.cssText = 'color: #888; font-style: italic; text-align: center; padding: 40px; font-size: 16px;';
            table.appendChild(noData);
            return table;
        }
        
        // Create header
        const header = document.createElement('div');
        header.className = 'table-header';
        
        const rankHeader = document.createElement('div');
        rankHeader.className = 'header-rank';
        rankHeader.textContent = 'RANK';
        
        const playerHeader = document.createElement('div');
        playerHeader.className = 'header-player';
        playerHeader.textContent = 'PLAYER';
        
        const scoreHeader = document.createElement('div');
        scoreHeader.className = 'header-score';
        scoreHeader.textContent = 'SCORE';
        
        const timeHeader = document.createElement('div');
        timeHeader.className = 'header-time';
        timeHeader.textContent = 'TIME';
        
        header.appendChild(rankHeader);
        header.appendChild(playerHeader);
        header.appendChild(scoreHeader);
        header.appendChild(timeHeader);
        
        // Create body
        const body = document.createElement('div');
        body.className = 'table-body';
        
        const fragment = document.createDocumentFragment();
        
        // Create rows for each score
        data.scores.forEach((score, index) => {
            const row = this.createLeaderboardRow(score, index);
            fragment.appendChild(row);
        });
        
        body.appendChild(fragment);
        table.appendChild(header);
        table.appendChild(body);
        
        return table;
    }

    createStats(data) {
        const stats = document.createElement('div');
        stats.className = 'leaderboard-stats info-line';
        
        // Handle null data gracefully
        if (!data) {
            const noData = document.createElement('div');
            noData.className = 'no-data-message';
            noData.textContent = 'No stats available';
            noData.style.cssText = 'color: #888; font-style: italic; text-align: center; padding: 10px;';
            stats.appendChild(noData);
            return stats;
        }
        
        const totalPlayers = document.createElement('div');
        totalPlayers.className = 'total-players';
        totalPlayers.textContent = `Total Players: ${data.total_players || 'Unknown'}`;
        
        const lastUpdated = document.createElement('div');
        lastUpdated.className = 'last-updated';
        lastUpdated.textContent = `Updated: ${data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : 'Unknown'}`;
        
        stats.appendChild(totalPlayers);
        stats.appendChild(lastUpdated);
        
        return stats;
    }

    createActionButtons() {
        const actions = document.createElement('div');
        actions.className = 'leaderboard-actions';
        
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshLeaderboardBtn';
        refreshBtn.className = 'action-btn primary';
        refreshBtn.textContent = '🔄 Refresh';
        
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closeLeaderboardBtn';
        closeBtn.className = 'action-btn secondary';
        closeBtn.textContent = '✕ Close';
        
        actions.appendChild(refreshBtn);
        actions.appendChild(closeBtn);
        
        return actions;
    }

    addEventListeners() {
        // Refresh button
        document.getElementById('refreshLeaderboardBtn').addEventListener('click', () => {
            this.hide();
            setTimeout(() => this.show(), 100);
        });
        
        // Close button
        document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
            this.hide();
        });
        
        // Click outside to close
        document.getElementById('leaderboard-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'leaderboard-overlay') {
                this.hide();
            }
        });
    }

    createLeaderboardRow(entry, index) {
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const playerName = entry.display_name || entry.player_name || 'Unknown Player';
        const rank = entry.rank || index + 1;
        const scoreTime = this.formatScoreTime(entry.timestamp);
        
        let playerId = entry.player_id;
        if (typeof playerId === 'object') {
            playerId = JSON.stringify(playerId);
        }
        
        const row = document.createElement('div');
        row.className = `leaderboard-row ${rankClass}`;
        
        // Rank cell
        const rankCell = document.createElement('div');
        rankCell.className = 'rank-cell';
        rankCell.innerHTML = `${medal} ${rank}`;
        row.appendChild(rankCell);
        
        // Player cell
        const playerCell = document.createElement('div');
        playerCell.className = 'player-cell';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'player-name';
        nameDiv.textContent = playerName;
        playerCell.appendChild(nameDiv);
        
        const idDiv = document.createElement('div');
        idDiv.className = 'player-id';
        idDiv.textContent = playerId;
        playerCell.appendChild(idDiv);
        
        row.appendChild(playerCell);
        
        // Score cell
        const scoreCell = document.createElement('div');
        scoreCell.className = 'score-cell';
        scoreCell.textContent = entry.score.toLocaleString();
        row.appendChild(scoreCell);
        
        // Time cell
        const timeCell = document.createElement('div');
        timeCell.className = 'time-cell';
        timeCell.textContent = scoreTime;
        row.appendChild(timeCell);
        
        return row;
    }

    formatResetTime(isoString, formattedDate) {
        if (formattedDate) {
            return `11:15 PM EST on ${formattedDate}`;
        }
        
        const now = new Date();
        const month = now.toLocaleDateString('en-US', { month: 'long' });
        const day = now.getDate();
        const year = now.getFullYear();
        const suffix = this.getOrdinalSuffix(day);
        
        return `11:15 PM EST on ${month} ${day}${suffix} ${year}`;
    }

    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    formatScoreTime(timestamp) {
        if (!timestamp) return '--:--';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '--:--';
            
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/New_York'
            });
        } catch (error) {
            return '--:--';
        }
    }

    formatTournamentPhase(data) {
        if (!data.tournament_phase) return null;
        
        switch (data.tournament_phase) {
            case 'celebration':
                const celebrationBanner = document.createElement('div');
                celebrationBanner.className = 'celebration-banner';
                
                const celebrationIcon = document.createElement('div');
                celebrationIcon.className = 'celebration-icon';
                celebrationIcon.textContent = '🏆';
                
                const celebrationText = document.createElement('div');
                celebrationText.className = 'celebration-text';
                
                const celebrationTitle = document.createElement('div');
                celebrationTitle.className = 'celebration-title';
                celebrationTitle.textContent = 'Tournament Complete!';
                
                const celebrationSubtitle = document.createElement('div');
                celebrationSubtitle.className = 'celebration-subtitle';
                celebrationSubtitle.textContent = 'Prizes being distributed • Next tournament starts at 11:15 PM EST';
                
                celebrationText.appendChild(celebrationTitle);
                celebrationText.appendChild(celebrationSubtitle);
                celebrationBanner.appendChild(celebrationIcon);
                celebrationBanner.appendChild(celebrationText);
                
                return celebrationBanner;
                
            case 'active':
                const statusBanner = document.createElement('div');
                statusBanner.className = 'tournament-status';
                
                const statusIcon = document.createElement('div');
                statusIcon.className = 'status-icon';
                statusIcon.textContent = '⚡';
                
                const statusText = document.createElement('div');
                statusText.className = 'status-text';
                statusText.textContent = 'Tournament Active • Ends at 11:00 PM EST';
                
                statusBanner.appendChild(statusIcon);
                statusBanner.appendChild(statusText);
                
                return statusBanner;
                
            default:
                return null;
        }
    }

    showError(message) {
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'leaderboard-error';
        errorOverlay.className = 'leaderboard-overlay';
        
        errorOverlay.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Leaderboard Error</div>
                <div class="error-message">${message}</div>
                <button id="closeErrorBtn" class="action-btn secondary">Close</button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        document.getElementById('closeErrorBtn').addEventListener('click', () => {
            errorOverlay.remove();
        });
    }
}
