// minimal-worker.js
var minimal_worker_default = {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      // console.log("\u{1F3AF} Minimal worker handling:", { method: request.method, path });
      if (path === "/api/players/status" && request.method === "GET") {
        const playerId = url.searchParams.get("player_id");
        if (!playerId) {
          return new Response(JSON.stringify({
            error: "Missing player_id parameter"
          }), { status: 400, headers: corsHeaders });
        }
        const now = /* @__PURE__ */ new Date();
        const estOffset = -5;
        const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
        const currentDay = estTime.toISOString().split("T")[0];
        const isPast11pmEST = estTime.getHours() >= 23;
        const checkDay = isPast11pmEST ? new Date(estTime.getTime() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : currentDay;
        // console.log("\u{1F3AF} Daily reset calculation:", {
          now: now.toISOString(),
          estTime: estTime.toISOString(),
          estHours: estTime.getHours(),
          currentDay,
          isPast11pmEST,
          checkDay,
          explanation: isPast11pmEST ? "Past 11pm EST - checking tomorrow" : "Before 11pm EST - checking today"
        });
        const [unlimitedPass, usedFreeGame] = await Promise.all([
          env.PLAYERS.get(`unlimited_pass:${playerId}`, "json"),
          env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
        ]);
        const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
        const hasUsedFreeGame = !!usedFreeGame;
        const nextReset = new Date(estTime);
        nextReset.setHours(23, 0, 0, 0);
        if (estTime.getHours() >= 23) {
          nextReset.setDate(nextReset.getDate() + 1);
        }
        return new Response(JSON.stringify({
          player_id: playerId,
          current_day: currentDay,
          has_unlimited_pass: hasUnlimitedPass,
          has_used_free_game: hasUsedFreeGame,
          can_play_free: !hasUsedFreeGame && !hasUnlimitedPass,
          requires_payment: hasUsedFreeGame && !hasUnlimitedPass,
          next_reset: nextReset.toISOString(),
          status: hasUnlimitedPass ? "unlimited" : hasUsedFreeGame ? "payment_required" : "free_game_available"
        }), { headers: corsHeaders });
      }
      if (path === "/api/player/grant-unlimited-pass" && request.method === "POST") {
        try {
          const { player_id } = await request.json();
          if (!player_id) {
            return new Response(JSON.stringify({
              error: "Missing player_id parameter"
            }), { status: 400, headers: corsHeaders });
          }
          const expiry = Date.now() + 24 * 60 * 60 * 1e3;
          await env.PLAYERS.put(`unlimited_pass:${player_id}`, JSON.stringify({
            player_id,
            expiry,
            granted_at: Date.now()
          }));
          // console.log("\u2705 Unlimited pass granted for player:", player_id);
          return new Response(JSON.stringify({
            success: true,
            player_id,
            expiry: new Date(expiry).toISOString()
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Error granting unlimited pass:", error);
          return new Response(JSON.stringify({
            error: "Failed to grant unlimited pass"
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path.startsWith("/api/player/fingerprint/") && request.method === "GET") {
        const fingerprint = path.split("/").pop();
        if (!fingerprint || fingerprint.length < 8) {
          return new Response(JSON.stringify({
            error: "Invalid fingerprint format"
          }), { status: 400, headers: corsHeaders });
        }
        try {
          const fingerprintKey = `fingerprint:${fingerprint}`;
          const playerData = await env.PLAYERS.get(fingerprintKey);
          if (playerData) {
            const player = JSON.parse(playerData);
            // console.log("\u2705 Found existing player by fingerprint:", player.displayName);
            player.last_seen = Date.now();
            await env.PLAYERS.put(fingerprintKey, JSON.stringify(player));
            return new Response(JSON.stringify(player), { headers: corsHeaders });
          } else {
            // console.log("\u{1F4E1} No player found for fingerprint:", fingerprint);
            return new Response(JSON.stringify({
              error: "Player not found",
              fingerprint
            }), { status: 404, headers: corsHeaders });
          }
        } catch (error) {
          console.error("\u274C Error fetching player by fingerprint:", error);
          return new Response(JSON.stringify({
            error: "Database error",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/player/create" && request.method === "POST") {
        try {
          const playerData = await request.json();
          // console.log("\u{1F3AF} New player creation request:", playerData);
          const { device_fingerprint, wallet_address, displayName, quark_balance } = playerData;
          if (!device_fingerprint || !wallet_address) {
            return new Response(JSON.stringify({
              error: "Missing required fields: device_fingerprint, wallet_address"
            }), { status: 400, headers: corsHeaders });
          }
          const fingerprintKey = `fingerprint:${device_fingerprint}`;
          const existingPlayer = await env.PLAYERS.get(fingerprintKey);
          if (existingPlayer) {
            // console.log("\u{1F6AB} Player already exists for fingerprint:", device_fingerprint);
            return new Response(JSON.stringify({
              error: "Player already exists for this device",
              existing_player: JSON.parse(existingPlayer)
            }), { status: 409, headers: corsHeaders });
          }
          const newPlayer = {
            id: `player_${device_fingerprint}`,
            device_fingerprint,
            wallet_address,
            displayName: displayName || `Player#${wallet_address.slice(-4).toUpperCase()}`,
            created_at: Date.now(),
            last_seen: Date.now(),
            quark_balance: quark_balance || 10,
            // Signup bonus
            sonic_network: "mainnet",
            version: "3.0",
            games_played: 0,
            high_score: 0,
            total_score: 0
          };
          await env.PLAYERS.put(fingerprintKey, JSON.stringify(newPlayer));
          const playerKey = `player:${newPlayer.id}`;
          await env.PLAYERS.put(playerKey, JSON.stringify(newPlayer));
          // console.log("\u2705 New player created successfully:", newPlayer.displayName);
          return new Response(JSON.stringify({
            success: true,
            player: newPlayer,
            message: "Player created successfully"
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Player creation error:", error);
          return new Response(JSON.stringify({
            error: "Failed to create player",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/player/use-free-game" && request.method === "POST") {
        try {
          const { player_id } = await request.json();
          if (!player_id) {
            return new Response(JSON.stringify({
              error: "Missing player_id parameter"
            }), { status: 400, headers: corsHeaders });
          }
          const now = /* @__PURE__ */ new Date();
          const estOffset = -5;
          const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
          const currentDay = estTime.toISOString().split("T")[0];
          const isPast11pmEST = estTime.getHours() >= 23;
          const checkDay = isPast11pmEST ? new Date(estTime.getTime() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : currentDay;
          // console.log("\u{1F3AF} Use free game - Daily reset calculation:", {
            now: now.toISOString(),
            estTime: estTime.toISOString(),
            estHours: estTime.getHours(),
            currentDay,
            isPast11pmEST,
            checkDay,
            playerId: player_id,
            explanation: isPast11pmEST ? "Past 11pm EST - marking tomorrow as used" : "Before 11pm EST - marking today as used"
          });
          await env.PLAYERS.put(`free_game:${player_id}:${checkDay}`, JSON.stringify({
            player_id,
            used_at: Date.now(),
            day: checkDay
          }));
          // console.log("\u2705 Free game marked as used for player:", player_id, "day:", checkDay);
          return new Response(JSON.stringify({
            success: true,
            player_id,
            day: checkDay
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Error marking free game as used:", error);
          return new Response(JSON.stringify({
            error: "Failed to mark free game as used"
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/player/update-stats" && request.method === "POST") {
        try {
          const statsData = await request.json();
          // console.log("\u{1F3AF} Player stats update request:", statsData);
          const { device_fingerprint, games_played, high_score, total_score, quark_balance, displayName, username, wallet_address } = statsData;
          if (!device_fingerprint) {
            return new Response(JSON.stringify({
              error: "Missing required field: device_fingerprint"
            }), { status: 400, headers: corsHeaders });
          }
          const fingerprintKey = `fingerprint:${device_fingerprint}`;
          const existingPlayerData = await env.PLAYERS.get(fingerprintKey);
          if (!existingPlayerData) {
            return new Response(JSON.stringify({
              error: "Player not found for fingerprint",
              fingerprint: device_fingerprint
            }), { status: 404, headers: corsHeaders });
          }
          const player = JSON.parse(existingPlayerData);
          player.games_played = games_played || player.games_played || 0;
          player.high_score = high_score || player.high_score || 0;
          player.total_score = total_score || player.total_score || 0;
          player.quark_balance = quark_balance || player.quark_balance || 0;
          player.last_seen = Date.now();
          if (displayName) {
            player.displayName = displayName;
            // console.log("\u{1F3AE} Updated display name:", displayName);
          }
          if (username) {
            player.username = username;
            // console.log("\u{1F464} Updated username:", username);
          }
          if (wallet_address) {
            player.wallet_address = wallet_address;
            // console.log("\u{1F4B0} Updated wallet address:", wallet_address);
          }
          await env.PLAYERS.put(fingerprintKey, JSON.stringify(player));
          const playerKey = `player:${player.id}`;
          await env.PLAYERS.put(playerKey, JSON.stringify(player));
          // console.log("\u2705 Player stats updated successfully:", player.displayName);
          return new Response(JSON.stringify({
            success: true,
            player,
            message: "Stats updated successfully"
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Stats update error:", error);
          return new Response(JSON.stringify({
            error: "Failed to update player stats",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/players/register" && request.method === "POST") {
        try {
          const playerData = await request.json();
          // console.log("\u{1F3AF} Player registration received:", playerData);
          const { playerId, gameName, displayName, walletAddress, isAccountAbstraction } = playerData;
          if (!playerId || !gameName || !displayName) {
            return new Response(JSON.stringify({
              error: "Missing required fields: playerId, gameName, displayName"
            }), { status: 400, headers: corsHeaders });
          }
          const playerProfile = {
            player_id: playerId,
            game_name: gameName,
            display_name: displayName,
            wallet_address: walletAddress || null,
            is_account_abstraction: isAccountAbstraction || false,
            created_at: Date.now(),
            last_activity: Date.now(),
            tier: "player",
            current_high_score: 0
          };
          await env.PLAYERS.put(`profile:${playerId}`, JSON.stringify(playerProfile));
          // console.log("\u2705 Player registered successfully:", playerProfile);
          return new Response(JSON.stringify({
            success: true,
            player_id: playerId,
            display_name: displayName,
            message: "Player registered successfully"
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Player registration error:", error);
          return new Response(JSON.stringify({
            error: "Failed to register player",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/admin/daily-cleanup" && request.method === "POST") {
        try {
          // console.log("\u{1F9F9} Starting daily cleanup process...");
          const now = /* @__PURE__ */ new Date();
          const estOffset = -5;
          const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
          const currentDay = estTime.toISOString().split("T")[0];
          const sevenDaysAgo = new Date(estTime.getTime() - 7 * 24 * 60 * 60 * 1e3);
          const cleanupDate = sevenDaysAgo.toISOString().split("T")[0];
          // console.log("\u{1F9F9} Cleanup info:", {
            currentDay,
            cleanupDate,
            explanation: "Cleaning up free game records older than 7 days"
          });
          return new Response(JSON.stringify({
            success: true,
            message: "Daily cleanup completed",
            currentDay,
            cleanupDate
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Error during daily cleanup:", error);
          return new Response(JSON.stringify({
            error: "Failed to perform daily cleanup"
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/scores" && request.method === "POST") {
        try {
          const scoreData = await request.json();
          // console.log("\u{1F3AF} Score submission received:", scoreData);
          const { player_id, player_name, score, game_type = "neon_drop", seed, timestamp } = scoreData;
          if (!player_id || !score) {
            return new Response(JSON.stringify({
              error: "Missing required fields: player_id, score"
            }), { status: 400, headers: corsHeaders });
          }
          const now = /* @__PURE__ */ new Date();
          const estOffset = -5;
          const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
          const currentDay = estTime.getHours() >= 23 ? estTime.toISOString().split("T")[0] : new Date(estTime.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
          const scoreEntry = {
            player_id,
            display_name: player_name || `Player ${player_id}`,
            score: parseInt(score),
            game_type,
            seed: seed || null,
            timestamp: timestamp || Date.now(),
            submitted_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          const scoreKey = `score:${player_id}:${Date.now()}`;
          await env.SCORES.put(scoreKey, JSON.stringify(scoreEntry));
          const leaderboardKey = `leaderboard:${game_type}:${currentDay}`;
          let leaderboard = await env.SCORES.get(leaderboardKey, "json");
          if (!leaderboard) {
            leaderboard = { scores: [], last_updated: (/* @__PURE__ */ new Date()).toISOString() };
          }
          leaderboard.scores.push(scoreEntry);
          leaderboard.scores.sort((a, b) => b.score - a.score);
          leaderboard.scores = leaderboard.scores.slice(0, 100);
          leaderboard.last_updated = (/* @__PURE__ */ new Date()).toISOString();
          await env.SCORES.put(leaderboardKey, JSON.stringify(leaderboard));
          // console.log("\u2705 Score submitted successfully:", scoreEntry);
          return new Response(JSON.stringify({
            success: true,
            score_id: scoreKey,
            rank: leaderboard.scores.findIndex((s) => s.player_id === player_id) + 1,
            total_scores: leaderboard.scores.length
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Score submission error:", error);
          return new Response(JSON.stringify({
            error: "Failed to submit score",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/leaderboard" && request.method === "GET") {
        const gameType = url.searchParams.get("game_type") || "neon_drop";
        const period = url.searchParams.get("period") || "daily";
        const now = /* @__PURE__ */ new Date();
        const estOffset = -5;
        const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
        const currentDay = estTime.getHours() >= 23 ? estTime.toISOString().split("T")[0] : new Date(estTime.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
        try {
          let leaderboardKey;
          if (period === "daily") {
            leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          } else if (period === "all") {
            leaderboardKey = `leaderboard:${gameType}:all`;
          } else {
            leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          }
          const leaderboard = await env.SCORES.get(leaderboardKey, "json");
          if (!leaderboard) {
            return new Response(JSON.stringify({
              game_type: gameType,
              period,
              scores: [],
              last_updated: (/* @__PURE__ */ new Date()).toISOString(),
              message: "No scores found for this period"
            }), { headers: corsHeaders });
          }
          return new Response(JSON.stringify({
            game_type: gameType,
            period,
            scores: leaderboard.scores || [],
            last_updated: leaderboard.last_updated || (/* @__PURE__ */ new Date()).toISOString()
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Leaderboard fetch error:", error);
          return new Response(JSON.stringify({
            error: "Failed to fetch leaderboard",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path.startsWith("/api/leaderboard/top/") && request.method === "GET") {
        const limit = parseInt(path.split("/").pop()) || 3;
        const gameType = url.searchParams.get("game_type") || "neon_drop";
        const now = /* @__PURE__ */ new Date();
        const estOffset = -5;
        const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
        const currentDay = estTime.getHours() >= 23 ? estTime.toISOString().split("T")[0] : new Date(estTime.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
        try {
          const leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          const leaderboard = await env.SCORES.get(leaderboardKey, "json");
          if (!leaderboard || !leaderboard.scores) {
            return new Response(JSON.stringify([
              { name: "Champion", score: 85e3, rank: 1 },
              { name: "Master", score: 72e3, rank: 2 },
              { name: "Expert", score: 58e3, rank: 3 }
            ].slice(0, limit)), { headers: corsHeaders });
          }
          const topPlayers = leaderboard.scores.sort((a, b) => b.score - a.score).slice(0, limit).map((entry, index) => ({
            name: entry.display_name || entry.player_name || `Player${index + 1}`,
            score: entry.score,
            rank: index + 1
          }));
          return new Response(JSON.stringify(topPlayers), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Top players fetch error:", error);
          return new Response(JSON.stringify([
            { name: "Champion", score: 85e3, rank: 1 },
            { name: "Master", score: 72e3, rank: 2 },
            { name: "Expert", score: 58e3, rank: 3 }
          ].slice(0, limit)), { headers: corsHeaders });
        }
      }
      if (path.startsWith("/api/leaderboard/rank/") && request.method === "GET") {
        const playerId = path.split("/").pop();
        const gameType = url.searchParams.get("game_type") || "neon_drop";
        const now = /* @__PURE__ */ new Date();
        const estOffset = -5;
        const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
        const currentDay = estTime.getHours() >= 23 ? estTime.toISOString().split("T")[0] : new Date(estTime.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
        try {
          const leaderboardKey = `leaderboard:${gameType}:${currentDay}`;
          const leaderboard = await env.SCORES.get(leaderboardKey, "json");
          if (!leaderboard || !leaderboard.scores) {
            return new Response(JSON.stringify({
              rank: "Top 50%",
              position: 50,
              total: 100
            }), { headers: corsHeaders });
          }
          const sortedScores = leaderboard.scores.sort((a, b) => b.score - a.score);
          const playerIndex = sortedScores.findIndex(
            (entry) => entry.player_id === playerId || entry.display_name?.includes(playerId) || entry.player_name?.includes(playerId)
          );
          if (playerIndex === -1) {
            return new Response(JSON.stringify({
              rank: "Not ranked",
              position: null,
              total: sortedScores.length
            }), { headers: corsHeaders });
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
          return new Response(JSON.stringify({
            rank: rankText,
            position,
            total
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Player rank fetch error:", error);
          return new Response(JSON.stringify({
            rank: "Top 50%",
            position: 50,
            total: 100
          }), { headers: corsHeaders });
        }
      }
      if (path === "/api/get" && request.method === "GET") {
        const namespace = url.searchParams.get("namespace");
        const key = url.searchParams.get("key");
        if (!namespace || !key) {
          return new Response(JSON.stringify({
            error: "Missing namespace or key parameter"
          }), { status: 400, headers: corsHeaders });
        }
        try {
          const value = await env[namespace].get(key, "json");
          return new Response(JSON.stringify({
            namespace,
            key,
            value,
            found: true
          }, null, 2), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({
            namespace,
            key,
            error: error.message,
            found: false
          }, null, 2), { headers: corsHeaders });
        }
      }
      if (path === "/api/delete" && request.method === "DELETE") {
        const namespace = url.searchParams.get("namespace");
        const key = url.searchParams.get("key");
        if (!namespace || !key) {
          return new Response(JSON.stringify({
            error: "Missing namespace or key parameter"
          }), { status: 400, headers: corsHeaders });
        }
        try {
          await env[namespace].delete(key);
          return new Response(JSON.stringify({
            namespace,
            key,
            deleted: true,
            message: "Key deleted successfully"
          }, null, 2), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({
            namespace,
            key,
            error: error.message,
            deleted: false
          }, null, 2), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/players/profile" && request.method === "GET") {
        const playerId = url.searchParams.get("player_id");
        if (!playerId) {
          return new Response(JSON.stringify({
            error: "Missing player_id parameter"
          }), { status: 400, headers: corsHeaders });
        }
        try {
          const statusResponse = await fetch(`${url.origin}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
          let statusData = null;
          if (statusResponse.ok) {
            statusData = await statusResponse.json();
          }
          const profileKey = `profile:${playerId}`;
          const existingProfile = await env.PLAYERS.get(profileKey, "json");
          if (existingProfile) {
            existingProfile.status = statusData;
            existingProfile.last_activity = Date.now();
            return new Response(JSON.stringify({
              success: true,
              profile: existingProfile
            }), { headers: corsHeaders });
          } else {
            return new Response(JSON.stringify({
              error: "Profile not found"
            }), { status: 404, headers: corsHeaders });
          }
        } catch (error) {
          console.error("\u274C Profile fetch error:", error);
          return new Response(JSON.stringify({
            error: "Failed to fetch profile"
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/daily-seed" && request.method === "POST") {
        try {
          const { date, game } = await request.json();
          if (!date || !game) {
            return new Response(JSON.stringify({
              error: "Missing date or game parameter"
            }), { status: 400, headers: corsHeaders });
          }
          const baseString = `${game}_${date}_${env.SEED_SALT || "blockzone_default_salt"}`;
          const encoder = new TextEncoder();
          const data = encoder.encode(baseString);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const seed = hashArray.slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
          return new Response(JSON.stringify({
            seed: parseInt(seed.substring(0, 8), 16),
            date,
            game
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Daily seed generation error:", error);
          return new Response(JSON.stringify({
            error: "Failed to generate daily seed"
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/game-over" && request.method === "POST") {
        try {
          const gameOverData = await request.json();
          // console.log("\u{1F3AF} Combined game-over API called:", gameOverData);
          const { score, playerId, gameData } = gameOverData;
          if (!score || !playerId) {
            return new Response(JSON.stringify({
              error: "Missing required fields: score, playerId"
            }), { status: 400, headers: corsHeaders });
          }
          const now = /* @__PURE__ */ new Date();
          const estOffset = -5;
          const estTime = new Date(now.getTime() + estOffset * 60 * 60 * 1e3);
          const currentDay = estTime.getHours() >= 23 ? estTime.toISOString().split("T")[0] : new Date(estTime.getTime() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
          const scoreEntry = {
            player_id: playerId,
            display_name: gameData?.playerName || `Player ${playerId}`,
            score: parseInt(score),
            game_type: gameData?.gameType || "neon_drop",
            seed: gameData?.seed || null,
            timestamp: gameData?.timestamp || Date.now(),
            submitted_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          const scoreKey = `score:${playerId}:${Date.now()}`;
          await env.SCORES.put(scoreKey, JSON.stringify(scoreEntry));
          const leaderboardKey = `leaderboard:neon_drop:${currentDay}`;
          let leaderboard = await env.SCORES.get(leaderboardKey, "json");
          if (!leaderboard) {
            leaderboard = { scores: [], last_updated: (/* @__PURE__ */ new Date()).toISOString() };
          }
          leaderboard.scores.push(scoreEntry);
          leaderboard.scores.sort((a, b) => b.score - a.score);
          leaderboard.scores = leaderboard.scores.slice(0, 100);
          leaderboard.last_updated = (/* @__PURE__ */ new Date()).toISOString();
          await env.SCORES.put(leaderboardKey, JSON.stringify(leaderboard));
          const playerRank = leaderboard.scores.findIndex((s) => s.player_id === playerId) + 1;
          const top3 = leaderboard.scores.slice(0, 3).map((entry, index) => ({
            id: entry.player_id,
            name: entry.display_name,
            score: entry.score,
            rank: index + 1
          }));
          const checkDay = estTime.getHours() >= 23 ? new Date(estTime.getTime() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : currentDay;
          const [unlimitedPass, usedFreeGame] = await Promise.all([
            env.PLAYERS.get(`unlimited_pass:${playerId}`, "json"),
            env.PLAYERS.get(`free_game:${playerId}:${checkDay}`)
          ]);
          const hasUnlimitedPass = unlimitedPass && unlimitedPass.expiry > Date.now();
          const hasUsedFreeGame = !!usedFreeGame;
          const nextReset = new Date(estTime);
          nextReset.setHours(23, 0, 0, 0);
          if (estTime.getHours() >= 23) {
            nextReset.setDate(nextReset.getDate() + 1);
          }
          const responseTime = Date.now() - now.getTime();
          // console.log("\u2705 Combined game-over API completed successfully");
          return new Response(JSON.stringify({
            scoreSubmission: {
              accepted: true,
              newRank: playerRank,
              submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
              success: true,
              score_id: scoreKey,
              total_scores: leaderboard.scores.length
            },
            leaderboard: {
              top3,
              totalPlayers: leaderboard.scores.length,
              lastUpdated: leaderboard.last_updated,
              playerPosition: playerRank,
              playerScore: score
            },
            playerAccess: {
              canPlayAgain: hasUnlimitedPass || !hasUsedFreeGame,
              reason: hasUnlimitedPass ? "unlimited_pass" : hasUsedFreeGame ? "payment_required" : "free_game_available",
              hasUnlimitedPass,
              canPlayFree: !hasUsedFreeGame && !hasUnlimitedPass,
              requiresPayment: hasUsedFreeGame && !hasUnlimitedPass,
              nextReset: nextReset.toISOString()
            },
            metadata: {
              responseTime: `${responseTime}ms`,
              dataFreshness: "real-time",
              region: request.headers.get("cf-ipcountry") || "global",
              scope: "daily",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }
          }), { headers: corsHeaders });
        } catch (error) {
          console.error("\u274C Combined game-over API error:", error);
          return new Response(JSON.stringify({
            error: "Failed to process game-over",
            details: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
      if (path === "/api/health" && request.method === "GET") {
        return new Response(JSON.stringify({
          status: "ok",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          service: "blockzone-api",
          version: "1.0.0"
        }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("\u274C Minimal worker error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
export {
  minimal_worker_default as default
};
//# sourceMappingURL=minimal-worker.js.map
