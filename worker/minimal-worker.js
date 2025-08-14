// BlockZone Lab - Minimal API Worker
// Optimized version with essential endpoints only

export default {
  async fetch(request, env) {
    // Debug: Log available environment variables
    console.log('🔍 Available env bindings:', Object.keys(env));
    console.log('🔍 PLAYERS binding:', env.PLAYERS ? 'Available' : 'Missing');
    console.log('🔍 SCORES binding:', env.SCORES ? 'Available' : 'Missing');
    
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

      // Helper function for daily reset calculation
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

      // Player Status endpoint
      if (path === '/api/players/status' && request.method === 'GET') {
        const playerId = url.searchParams.get('player_id');
        if (!playerId) {
          return new Response(JSON.stringify({ error: 'Missing player_id parameter' }), { status: 400, headers: corsHeaders });
        }
        
        const { checkDay, nextReset } = getDailyReset();
        const [unlimitedPass, usedFreeGame] = await Promise.all([
          env.PLAYERS.get(`unlimited_pass:${playerId}`, 'json'),
          env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
        ]);
        
        const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
        const hasUsedFreeGame = !!usedFreeGame;
        
        return new Response(JSON.stringify({
          player_id: playerId,
          has_unlimited_pass: hasUnlimitedPass,
          has_used_free_game: hasUsedFreeGame,
          can_play_free: !hasUsedFreeGame && !hasUnlimitedPass,
          requires_payment: hasUsedFreeGame && !hasUnlimitedPass,
          next_reset: nextReset.toISOString(),
          status: hasUnlimitedPass ? 'unlimited' : hasUsedFreeGame ? 'payment_required' : 'free_game_available'
        }), { headers: corsHeaders });
      }

      // Grant unlimited pass endpoint
      if (path === '/api/player/grant-unlimited-pass' && request.method === 'POST') {
        try {
          const { player_id } = await request.json();
          if (!player_id) {
            return new Response(JSON.stringify({ error: 'Missing player_id parameter' }), { status: 400, headers: corsHeaders });
          }
          
          const expiry = Date.now() + (24 * 60 * 60 * 1000);
          await env.PLAYERS.put(`unlimited_pass:${player_id}`, JSON.stringify({
            player_id, expiry, granted_at: Date.now()
          }));
          
          return new Response(JSON.stringify({
            success: true, player_id, expiry: new Date(expiry).toISOString()
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to grant unlimited pass' }), { status: 500, headers: corsHeaders });
        }
      }

      // Get/Create player by fingerprint
      if (path.startsWith('/api/player/fingerprint/') && request.method === 'GET') {
        const fingerprint = path.split('/').pop();
        if (!fingerprint || fingerprint.length < 8) {
          return new Response(JSON.stringify({ error: 'Invalid fingerprint format' }), { status: 400, headers: corsHeaders });
        }
        
        const fingerprintKey = `fingerprint:${fingerprint}`;
        const playerData = await env.PLAYERS.get(fingerprintKey);
        
        if (playerData) {
          const player = JSON.parse(playerData);
          player.last_seen = Date.now();
          await env.PLAYERS.put(fingerprintKey, JSON.stringify(player));
          return new Response(JSON.stringify(player), { headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ error: 'Player not found', fingerprint }), { status: 404, headers: corsHeaders });
        }
      }

      // Create player with fingerprint
      if (path === '/api/player/create' && request.method === 'POST') {
        try {
          const { device_fingerprint, wallet_address, displayName, quark_balance } = await request.json();
          
          if (!device_fingerprint || !wallet_address) {
            return new Response(JSON.stringify({ error: 'Missing required fields: device_fingerprint, wallet_address' }), { status: 400, headers: corsHeaders });
          }
          
          const fingerprintKey = `fingerprint:${device_fingerprint}`;
          const existingPlayer = await env.PLAYERS.get(fingerprintKey);
          
          if (existingPlayer) {
            return new Response(JSON.stringify({ error: 'Player already exists for this device', existing_player: JSON.parse(existingPlayer) }), { status: 409, headers: corsHeaders });
          }
          
          const newPlayer = {
            id: `player_${device_fingerprint}`,
            device_fingerprint, wallet_address,
            displayName: displayName || `Player#${wallet_address.slice(-4).toUpperCase()}`,
            created_at: Date.now(), last_seen: Date.now(),
            quark_balance: quark_balance || 10,
            sonic_network: 'mainnet', version: '3.0',
            games_played: 0, high_score: 0, total_score: 0
          };
          
          await Promise.all([
            env.PLAYERS.put(fingerprintKey, JSON.stringify(newPlayer)),
            env.PLAYERS.put(`player:${newPlayer.id}`, JSON.stringify(newPlayer))
          ]);
          
          return new Response(JSON.stringify({ success: true, player: newPlayer, message: 'Player created successfully' }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to create player', details: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // Mark free game as used
      if (path === '/api/player/use-free-game' && request.method === 'POST') {
        try {
          const { player_id } = await request.json();
          if (!player_id) {
            return new Response(JSON.stringify({ error: 'Missing player_id parameter' }), { status: 400, headers: corsHeaders });
          }
          
          const { checkDay } = getDailyReset();
          await env.PLAYERS.put(`free_game:${player_id}:${checkDay}`, JSON.stringify({
            player_id, used_at: Date.now(), day: checkDay
          }));
          
          return new Response(JSON.stringify({ success: true, player_id, day: checkDay }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to mark free game as used' }), { status: 500, headers: corsHeaders });
        }
      }

      // Update player stats
      if (path === '/api/player/update-stats' && request.method === 'POST') {
        try {
          const { device_fingerprint, games_played, high_score, total_score, quark_balance, displayName, username, wallet_address } = await request.json();
          
          if (!device_fingerprint) {
            return new Response(JSON.stringify({ error: 'Missing required field: device_fingerprint' }), { status: 400, headers: corsHeaders });
          }
          
          const fingerprintKey = `fingerprint:${device_fingerprint}`;
          const existingPlayerData = await env.PLAYERS.get(fingerprintKey);
          
          if (!existingPlayerData) {
            return new Response(JSON.stringify({ error: 'Player not found for fingerprint', fingerprint: device_fingerprint }), { status: 404, headers: corsHeaders });
          }
          
          const player = JSON.parse(existingPlayerData);
          Object.assign(player, {
            games_played: games_played || player.games_played || 0,
            high_score: high_score || player.high_score || 0,
            total_score: total_score || player.total_score || 0,
            quark_balance: quark_balance || player.quark_balance || 0,
            last_seen: Date.now(),
            ...(displayName && { displayName }),
            ...(username && { username }),
            ...(wallet_address && { wallet_address })
          });
          
          await Promise.all([
            env.PLAYERS.put(fingerprintKey, JSON.stringify(player)),
            env.PLAYERS.put(`player:${player.id}`, JSON.stringify(player))
          ]);
          
          return new Response(JSON.stringify({ success: true, player, message: 'Stats updated successfully' }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to update player stats', details: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // Score submission endpoint
      if (path === '/api/scores' && request.method === 'POST') {
        try {
          const { player_id, player_name, score, game_type = 'neon_drop', seed, timestamp } = await request.json();
          
          if (!player_id || !score) {
            return new Response(JSON.stringify({ error: 'Missing required fields: player_id, score' }), { status: 400, headers: corsHeaders });
          }
          
          const { currentDay } = getDailyReset();
          const scoreEntry = {
            player_id, display_name: player_name || `Player ${player_id}`,
            score: parseInt(score), game_type, seed: seed || null,
            timestamp: timestamp || Date.now(), submitted_at: new Date().toISOString()
          };
          
          const scoreKey = `score:${player_id}:${Date.now()}`;
          await env.SCORES.put(scoreKey, JSON.stringify(scoreEntry));
          
          // Update daily leaderboard
          const leaderboardKey = `leaderboard:${game_type}:${currentDay}`;
          let leaderboard = await env.SCORES.get(leaderboardKey, 'json') || { scores: [], last_updated: new Date().toISOString() };
          
          leaderboard.scores.push(scoreEntry);
          leaderboard.scores.sort((a, b) => b.score - a.score);
          leaderboard.scores = leaderboard.scores.slice(0, 100);
          leaderboard.last_updated = new Date().toISOString();
          
          await env.SCORES.put(leaderboardKey, JSON.stringify(leaderboard));
          
          return new Response(JSON.stringify({
            success: true, score_id: scoreKey,
            rank: leaderboard.scores.findIndex(s => s.player_id === player_id) + 1,
            total_scores: leaderboard.scores.length
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to submit score', details: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // Leaderboard endpoint
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const gameType = url.searchParams.get('game_type') || 'neon_drop';
        const period = url.searchParams.get('period') || 'daily';
        const { currentDay } = getDailyReset();
        
        try {
          const leaderboardKey = period === 'all' ? `leaderboard:${gameType}:all` : `leaderboard:${gameType}:${currentDay}`;
          const leaderboard = await env.SCORES.get(leaderboardKey, 'json');
          
          if (!leaderboard) {
            return new Response(JSON.stringify({
              game_type: gameType, period, scores: [],
              last_updated: new Date().toISOString(), message: 'No scores found for this period'
            }), { headers: corsHeaders });
          }
          
          return new Response(JSON.stringify({
            game_type: gameType, period,
            scores: leaderboard.scores || [],
            last_updated: leaderboard.last_updated || new Date().toISOString()
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard', details: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // Top players endpoint
      if (path.startsWith('/api/leaderboard/top/') && request.method === 'GET') {
        const limit = parseInt(path.split('/').pop()) || 3;
        const gameType = url.searchParams.get('game_type') || 'neon_drop';
        const { currentDay } = getDailyReset();
        
        try {
          const leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          const leaderboard = await env.SCORES.get(leaderboardKey, 'json');
          
          if (!leaderboard || !leaderboard.scores) {
            return new Response(JSON.stringify([
              { name: 'Champion', score: 85000, rank: 1 },
              { name: 'Master', score: 72000, rank: 2 },
              { name: 'Expert', score: 58000, rank: 3 }
            ].slice(0, limit)), { headers: corsHeaders });
          }
          
          const topPlayers = leaderboard.scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((entry, index) => ({
              name: entry.display_name || entry.player_name || `Player${index + 1}`,
              score: entry.score, rank: index + 1
            }));
          
          return new Response(JSON.stringify(topPlayers), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify([
            { name: 'Champion', score: 85000, rank: 1 },
            { name: 'Master', score: 72000, rank: 2 },
            { name: 'Expert', score: 58000, rank: 3 }
          ].slice(0, limit)), { headers: corsHeaders });
        }
      }

      // Player rank endpoint
      if (path.startsWith('/api/leaderboard/rank/') && request.method === 'GET') {
        const playerId = path.split('/').pop();
        const gameType = url.searchParams.get('game_type') || 'neon_drop';
        const { currentDay } = getDailyReset();
        
        try {
          const leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          const leaderboard = await env.SCORES.get(leaderboardKey, 'json');
          
          if (!leaderboard || !leaderboard.scores) {
            return new Response(JSON.stringify({ rank: "Top 50%", position: 50, total: 100 }), { headers: corsHeaders });
          }
          
          const sortedScores = leaderboard.scores.sort((a, b) => b.score - a.score);
          const playerIndex = sortedScores.findIndex(entry => 
            entry.player_id === playerId || 
            entry.display_name?.includes(playerId) ||
            entry.player_name?.includes(playerId)
          );
          
          if (playerIndex === -1) {
            return new Response(JSON.stringify({ rank: "Not ranked", position: null, total: sortedScores.length }), { headers: corsHeaders });
          }
          
          const position = playerIndex + 1;
          const total = sortedScores.length;
          const percentile = Math.round((1 - position / total) * 100);
          
          let rankText;
          if (percentile >= 95) rankText = "Top 1%";
          else if (percentile >= 90) rankText = "Top 5%";
          else if (percentile >= 80) rankText = "Top 10%";
          else if (percentile >= 60) rankText = "Top 25%";
          else if (percentile >= 40) rankText = "Top 50%";
          else rankText = "Top 75%";
          
          return new Response(JSON.stringify({ rank: rankText, position, total }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ rank: "Top 50%", position: 50, total: 100 }), { headers: corsHeaders });
        }
      }

      // Combined Game-Over endpoint (most efficient)
      if (path === '/api/game-over' && request.method === 'POST') {
        try {
          const { score, playerId, gameData } = await request.json();
          
          if (!score || !playerId) {
            return new Response(JSON.stringify({ error: 'Missing required fields: score, playerId' }), { status: 400, headers: corsHeaders });
          }
          
          const { currentDay, checkDay, nextReset, estTime } = getDailyReset();
          
          // Submit score and update leaderboard
          const scoreEntry = {
            player_id: playerId,
            display_name: gameData?.playerName || `Player ${playerId}`,
            score: parseInt(score),
            game_type: gameData?.gameType || 'neon_drop',
            seed: gameData?.seed || null,
            timestamp: gameData?.timestamp || Date.now(),
            submitted_at: new Date().toISOString()
          };
          
          const scoreKey = `score:${playerId}:${Date.now()}`;
          await env.SCORES.put(scoreKey, JSON.stringify(scoreEntry));
          
          const leaderboardKey = `leaderboard:neon_drop:${currentDay}`;
          let leaderboard = await env.SCORES.get(leaderboardKey, 'json') || { scores: [], last_updated: new Date().toISOString() };
          
          leaderboard.scores.push(scoreEntry);
          leaderboard.scores.sort((a, b) => b.score - a.score);
          leaderboard.scores = leaderboard.scores.slice(0, 100);
          leaderboard.last_updated = new Date().toISOString();
          
          await env.SCORES.put(leaderboardKey, JSON.stringify(leaderboard));
          
          const playerRank = leaderboard.scores.findIndex(s => s.player_id === playerId) + 1;
          const top3 = leaderboard.scores.slice(0, 3).map((entry, index) => ({
            id: entry.player_id, name: entry.display_name, score: entry.score, rank: index + 1
          }));
          
          // Check player access
          const [unlimitedPass, usedFreeGame] = await Promise.all([
            env.PLAYERS.get(`unlimited_pass:${playerId}`, 'json'),
            env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
          ]);
          
          const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
          const hasUsedFreeGame = !!usedFreeGame;
          
          return new Response(JSON.stringify({
            scoreSubmission: { accepted: true, newRank: playerRank, submittedAt: new Date().toISOString(), success: true, score_id: scoreKey, total_scores: leaderboard.scores.length },
            leaderboard: { top3, totalPlayers: leaderboard.scores.length, lastUpdated: leaderboard.last_updated, playerPosition: playerRank, playerScore: score },
            playerAccess: {
              canPlayAgain: hasUnlimitedPass || !hasUsedFreeGame,
              reason: hasUnlimitedPass ? 'unlimited_pass' : hasUsedFreeGame ? 'payment_required' : 'free_game_available',
              hasUnlimitedPass, canPlayFree: !hasUsedFreeGame && !hasUnlimitedPass,
              requiresPayment: hasUsedFreeGame && !hasUnlimitedPass, nextReset: nextReset.toISOString()
            },
            metadata: { timestamp: new Date().toISOString() }
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to process game-over', details: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // Health check endpoint
      if (path === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok', timestamp: new Date().toISOString(),
          service: 'blockzone-api', version: '1.0.0'
        }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  }
};
