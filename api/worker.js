/**
 * BlockZone Lab Fresh - Clean API Worker
 * Extracted and cleaned from your proven backend architecture
 * Preserving all working business logic with zero technical debt
 */

export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // Your proven daily reset calculation (11pm EST)
            const getDailyReset = () => {
                const now = new Date();
                const estOffset = -5;
                const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
                const currentDay = estTime.toISOString().split('T')[0];
                const isPast11pmEST = estTime.getHours() >= 23;
                const checkDay = isPast11pmEST ? 
                    new Date(estTime.getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
                    currentDay;
                
                const nextReset = new Date(estTime);
                nextReset.setHours(23, 0, 0, 0);
                if (estTime.getHours() >= 23) {
                    nextReset.setDate(nextReset.getDate() + 1);
                }
                
                return { currentDay, checkDay, nextReset, estTime };
            };

            // Player Registration (Your proven fingerprint system)
            if (path === '/api/player/register' && request.method === 'POST') {
                try {
                    const playerData = await request.json();
                    const { deviceId, name } = playerData;
                    
                    if (!deviceId || !name) {
                        return new Response(JSON.stringify({ 
                            error: 'Missing required fields: deviceId, name' 
                        }), { status: 400, headers: corsHeaders });
                    }

                    // Check if player already exists
                    const existingPlayer = await env.PLAYERS.get(`player:${deviceId}`, 'json');
                    if (existingPlayer) {
                        return new Response(JSON.stringify({
                            success: true,
                            player: existingPlayer,
                            message: 'Player already registered'
                        }), { headers: corsHeaders });
                    }

                    // Create new player with your proven structure
                    const newPlayer = {
                        id: `player_${deviceId}`,
                        name: name,
                        deviceId: deviceId,
                        createdAt: new Date().toISOString(),
                        stats: {
                            gamesPlayed: 0,
                            bestScore: 0,
                            totalScore: 0,
                            averageScore: 0
                        },
                        payment: {
                            freeGamesUsed: 0,
                            hasDayPass: false,
                            dayPassExpiry: null,
                            quarksBalance: 10 // Welcome gift!
                        }
                    };

                    await env.PLAYERS.put(`player:${deviceId}`, JSON.stringify(newPlayer));
                    
                    return new Response(JSON.stringify({
                        success: true,
                        player: newPlayer,
                        message: `Welcome ${name}! You received 10 Quarks!`
                    }), { headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to register player', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Player Status (Your proven access control)
            if (path === '/api/player/status' && request.method === 'POST') {
                try {
                    const { playerId } = await request.json();
                    if (!playerId) {
                        return new Response(JSON.stringify({ 
                            error: 'Missing playerId' 
                        }), { status: 400, headers: corsHeaders });
                    }
                    
                    const { checkDay, nextReset } = getDailyReset();
                    
                    // Get player data and access status
                    const [player, unlimitedPass, usedFreeGame] = await Promise.all([
                        env.PLAYERS.get(`player:${playerId.replace('player_', '')}`, 'json'),
                        env.PLAYERS.get(`unlimited_pass:${playerId}`, 'json'),
                        env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
                    ]);
                    
                    if (!player) {
                        return new Response(JSON.stringify({ 
                            error: 'Player not found' 
                        }), { status: 404, headers: corsHeaders });
                    }

                    const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
                    const hasUsedFreeGame = !!usedFreeGame;
                    
                    return new Response(JSON.stringify({
                        canPlay: hasUnlimitedPass || !hasUsedFreeGame,
                        reason: hasUnlimitedPass ? 'unlimited_pass' : hasUsedFreeGame ? 'payment_required' : 'free_game_available',
                        player: player,
                        access: {
                            hasUnlimitedPass,
                            hasUsedFreeGame,
                            canPlayFree: !hasUsedFreeGame,
                            requiresPayment: hasUsedFreeGame && !hasUnlimitedPass,
                            nextReset: nextReset.toISOString()
                        }
                    }), { headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to check player status', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Game Start (Your proven credit consumption)
            if (path === '/api/game/start' && request.method === 'POST') {
                try {
                    const { playerId, gameType = 'neon_drop' } = await request.json();
                    if (!playerId) {
                        return new Response(JSON.stringify({ 
                            error: 'Missing playerId' 
                        }), { status: 400, headers: corsHeaders });
                    }

                    const { checkDay } = getDailyReset();
                    
                    // Check access and consume credit
                    const [unlimitedPass, usedFreeGame] = await Promise.all([
                        env.PLAYERS.get(`unlimited_pass:${playerId}`, 'json'),
                        env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
                    ]);

                    const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
                    const hasUsedFreeGame = !!usedFreeGame;

                    if (!hasUnlimitedPass && hasUsedFreeGame) {
                        return new Response(JSON.stringify({ 
                            error: 'Payment required',
                            canPlay: false,
                            reason: 'payment_required'
                        }), { status: 402, headers: corsHeaders });
                    }

                    // Consume free game credit if needed
                    if (!hasUnlimitedPass && !hasUsedFreeGame) {
                        await env.PLAYERS.put(`free_game:${playerId}:${checkDay}`, 'used');
                    }

                    // Generate game session
                    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const gameSession = {
                        sessionId,
                        playerId,
                        gameType,
                        startTime: new Date().toISOString(),
                        seed: Math.floor(Math.random() * 1000000),
                        creditUsed: hasUnlimitedPass ? 'unlimited_pass' : 'free_game'
                    };

                    await env.SESSIONS.put(sessionId, JSON.stringify(gameSession));

                    return new Response(JSON.stringify({
                        success: true,
                        sessionId,
                        gameSession,
                        message: hasUnlimitedPass ? 'Game started with unlimited pass' : 'Free game started'
                    }), { headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to start game', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Game Over (Your proven leaderboard system)
            if (path === '/api/game/complete' && request.method === 'POST') {
                try {
                    const { sessionId, score, lines, time, playerName } = await request.json();
                    
                    if (!sessionId || score === undefined) {
                        return new Response(JSON.stringify({ 
                            error: 'Missing required fields: sessionId, score' 
                        }), { status: 400, headers: corsHeaders });
                    }

                    // Get game session
                    const gameSession = await env.SESSIONS.get(sessionId, 'json');
                    if (!gameSession) {
                        return new Response(JSON.stringify({ 
                            error: 'Invalid session' 
                        }), { status: 404, headers: corsHeaders });
                    }

                    const { currentDay } = getDailyReset();
                    const playerId = gameSession.playerId;

                    // Update player stats
                    const player = await env.PLAYERS.get(`player:${playerId.replace('player_', '')}`, 'json');
                    if (player) {
                        player.stats.gamesPlayed++;
                        player.stats.totalScore += score;
                        player.stats.averageScore = Math.floor(player.stats.totalScore / player.stats.gamesPlayed);
                        
                        if (score > player.stats.bestScore) {
                            player.stats.bestScore = score;
                        }

                        await env.PLAYERS.put(`player:${playerId.replace('player_', '')}`, JSON.stringify(player));
                    }

                    // Submit to leaderboard (Your proven system)
                    const scoreEntry = {
                        player_id: playerId,
                        display_name: playerName || player?.name || `Player ${playerId}`,
                        score: parseInt(score),
                        lines: lines || 0,
                        time: time || 0,
                        game_type: 'neon_drop',
                        seed: gameSession.seed,
                        timestamp: Date.now(),
                        submitted_at: new Date().toISOString()
                    };

                    // Store individual score
                    const scoreKey = `score:${playerId}:${Date.now()}`;
                    await env.SCORES.put(scoreKey, JSON.stringify(scoreEntry));

                    // Update daily leaderboard
                    const leaderboardKey = `leaderboard:neon_drop:${currentDay}`;
                    let leaderboard = await env.SCORES.get(leaderboardKey, 'json') || { 
                        scores: [], 
                        last_updated: new Date().toISOString() 
                    };

                    leaderboard.scores.push(scoreEntry);
                    leaderboard.scores.sort((a, b) => b.score - a.score);
                    leaderboard.scores = leaderboard.scores.slice(0, 100); // Top 100
                    leaderboard.last_updated = new Date().toISOString();

                    await env.SCORES.put(leaderboardKey, JSON.stringify(leaderboard));

                    // Calculate player rank
                    const playerRank = leaderboard.scores.findIndex(s => s.player_id === playerId) + 1;
                    const top10 = leaderboard.scores.slice(0, 10).map((entry, index) => ({
                        rank: index + 1,
                        name: entry.display_name,
                        score: entry.score,
                        playerId: entry.player_id
                    }));

                    // Clean up session
                    await env.SESSIONS.delete(sessionId);

                    return new Response(JSON.stringify({
                        success: true,
                        scoreSubmitted: true,
                        playerRank,
                        leaderboard: {
                            top10,
                            totalPlayers: leaderboard.scores.length,
                            playerPosition: playerRank,
                            playerScore: score
                        },
                        playerStats: player?.stats || {},
                        message: `Game complete! You ranked #${playerRank} today.`
                    }), { headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to complete game', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Daily Leaderboard (Your proven system)
            if (path === '/api/leaderboard/daily' && request.method === 'GET') {
                try {
                    const { currentDay } = getDailyReset();
                    const leaderboardKey = `leaderboard:neon_drop:${currentDay}`;
                    
                    const leaderboard = await env.SCORES.get(leaderboardKey, 'json') || { 
                        scores: [], 
                        last_updated: new Date().toISOString() 
                    };

                    const top10 = leaderboard.scores.slice(0, 10).map((entry, index) => ({
                        rank: index + 1,
                        name: entry.display_name,
                        score: entry.score,
                        playerId: entry.player_id
                    }));

                    return new Response(JSON.stringify({
                        success: true,
                        leaderboard: top10,
                        totalPlayers: leaderboard.scores.length,
                        lastUpdated: leaderboard.last_updated,
                        date: currentDay
                    }), { headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to get leaderboard', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Payment Processing (Your proven unlimited pass system)
            if (path === '/api/payment/process' && request.method === 'POST') {
                try {
                    const { playerId, paymentType, transactionId, amount } = await request.json();
                    
                    if (!playerId || !paymentType || !transactionId) {
                        return new Response(JSON.stringify({ 
                            error: 'Missing required fields: playerId, paymentType, transactionId' 
                        }), { status: 400, headers: corsHeaders });
                    }

                    if (paymentType === 'unlimited_pass') {
                        // Grant unlimited pass until 11pm EST
                        const { nextReset } = getDailyReset();
                        const unlimitedPass = {
                            player_id: playerId,
                            expiry: nextReset.getTime(),
                            granted_at: Date.now(),
                            transaction_id: transactionId,
                            amount: amount || 2.50
                        };

                        await env.PLAYERS.put(`unlimited_pass:${playerId}`, JSON.stringify(unlimitedPass));

                        return new Response(JSON.stringify({
                            success: true,
                            paymentType: 'unlimited_pass',
                            expiry: nextReset.toISOString(),
                            message: 'Unlimited pass granted until 11pm EST!'
                        }), { headers: corsHeaders });
                    }

                    return new Response(JSON.stringify({ 
                        error: 'Invalid payment type' 
                    }), { status: 400, headers: corsHeaders });

                } catch (error) {
                    return new Response(JSON.stringify({ 
                        error: 'Failed to process payment', 
                        details: error.message 
                    }), { status: 500, headers: corsHeaders });
                }
            }

            // Health Check
            if (path === '/api/health' && request.method === 'GET') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'blockzone-fresh-api',
                    version: '2.0.0',
                    timestamp: new Date().toISOString()
                }), { headers: corsHeaders });
            }

            return new Response(JSON.stringify({ 
                error: 'Endpoint not found' 
            }), { status: 404, headers: corsHeaders });

        } catch (error) {
            console.error('API Error:', error);
            return new Response(JSON.stringify({ 
                error: 'Internal server error', 
                details: error.message 
            }), { status: 500, headers: corsHeaders });
        }
    }
};
