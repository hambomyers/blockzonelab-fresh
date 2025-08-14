class B{constructor(t){this.apiBase="https://api.blockzonelab.com",this.isVisible=!1,this.currentScore=0,this.identitySystem=null,this.eventBus=t,this.identityCache=null,this.cacheTimestamp=0,this.CACHE_DURATION=3e4,this.pendingAPIResponse=null,this.cachedLeaderboardData=null,this.currentGameScore=null,this.apiCallInProgress=!1,this.LOG_LEVEL={ERROR:0,WARN:1,INFO:2,DEBUG:3},this.currentLogLevel=this.LOG_LEVEL.WARN}setIdentitySystem(t){this.identitySystem=t}log(t,e,o=null){t<=this.currentLogLevel}getCurrentGameSession(){const t=this.getPlayerId(),e=Math.floor(Date.now()/1e3);return`${t}_${e}`}resetGameOverState(){this.gameOverApiCallMade=!1,this.currentGameSession=null,this.lastLeaderboardData=null,this.identityCache=null,this.cacheTimestamp=0,this.pendingAPIResponse=null,this.cachedLeaderboardData=null,this.currentGameScore=null,this.apiCallInProgress=!1,this.log(this.LOG_LEVEL.INFO,"🔄 Game over state reset for new game")}hasLeaderboardDataChanged(t){if(!this.lastLeaderboardData)return!0;const e=this.lastLeaderboardData,o=t.scores||[],n=e.scores||[];if(o.length!==n.length)return!0;for(let r=0;r<Math.min(3,o.length);r++)if(!n[r]||n[r].score!==o[r].score||n[r].display_name!==o[r].display_name)return!0;return!1}async show(t,e={}){this.log(this.LOG_LEVEL.INFO,"🎮 GameOverSystem.show() called",{data:t,metrics:e});let o;if(typeof t=="object"&&t.score!==void 0)o=t.score,this.log(this.LOG_LEVEL.DEBUG,"🎮 Extracted score from data object:",o);else if(typeof t=="number")o=t,this.log(this.LOG_LEVEL.DEBUG,"🎮 Using direct score value:",o);else{this.log(this.LOG_LEVEL.ERROR,"❌ Invalid score data:",t);return}if(this.isVisible){this.log(this.LOG_LEVEL.WARN,"⚠️ GameOverSystem already visible, returning early");return}this.isVisible=!0,this.currentScore=o,this.createOverlayWithHardcodedMedals(o);const{playerName:n,playerID:r}=await this.getIdentityDataOnce();if(this.updateOverlayWithPlayerInfo(o,n,r),this.startBackgroundAPICalls(o,n,r),await this.checkEmailRequirement(n,r)){this.log(this.LOG_LEVEL.INFO,"📧 Email capture needed - showing email modal first");const i=await this.showEmailCaptureBeforeGameOver(o,n,r);this.log(this.LOG_LEVEL.INFO,"📧 Email capture completed:",i),await this.updateGameOverUIWithFreshData(o,n,r)}}async checkEmailRequirement(t,e){const o=t.startsWith("Player#"),n=localStorage.getItem("blockzone_player_profile");if(n)try{const a=JSON.parse(n),p=Date.now()-(a.lastSession||0)<10080*60*1e3;if(a.displayName&&a.displayName.includes("#")&&p){if(window.gameWrapper?.identityManager?.playerIdentity){const d=window.gameWrapper.identityManager.getCurrentPlayer();d&&(d.displayName=a.displayName,d.hasCustomName=!0,d.username=a.displayName.split("#")[0],d.email=a.email,await window.gameWrapper.identityManager.playerIdentity.saveToStorage(d))}return!1}}catch{}return o}async showEmailCaptureBeforeGameOver(t,e,o){return new Promise(n=>{this.blockGameInteraction();const r=document.createElement("div");r.id="email-capture-modal",r.style.cssText=`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Bungee', monospace;
            `,r.innerHTML=`
                <div style="
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    border: 2px solid #00d4ff;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
                ">
                    <h2 style="color: #00d4ff; margin-bottom: 20px; font-size: 24px;">🏆 Get on the Leaderboard!</h2>
                    <p style="color: #ffffff; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">Enter your name and contact info to appear on the leaderboard instead of "${e}"</p>
                    
                    <input type="text" id="player-name-input" placeholder="Enter your name" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 15px;
                        border: 2px solid #00d4ff;
                        border-radius: 8px;
                        background: rgba(0, 0, 0, 0.7);
                        color: #ffffff;
                        font-size: 16px;
                        font-family: 'Bungee', monospace;
                        text-align: center;
                    " maxlength="30">
                    
                    <!-- Social Media Options -->
                    <div style="margin-bottom: 15px;">
                        <p style="color: #cccccc; font-size: 14px; margin-bottom: 10px;">Connect with social media (required for scoreboard):</p>
                        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
                            <button type="button" id="instagram-btn" style="
                                background: linear-gradient(45deg, #E4405F, #C13584);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                📷 Instagram
                            </button>
                            
                            <button type="button" id="tiktok-btn" style="
                                background: linear-gradient(45deg, #000000, #ff0050);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                🎥 TikTok
                            </button>
                            
                            <button type="button" id="twitter-btn" style="
                                background: linear-gradient(45deg, #1DA1F2, #0d8bd9);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                🐦 Twitter
                            </button>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 15px; color: #888888; font-size: 14px;">OR</div>
                    
                    <input type="email" id="player-email-input" placeholder="Email (required for scoreboard)" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 20px;
                        border: 2px solid #00d4ff;
                        border-radius: 8px;
                        background: rgba(0, 0, 0, 0.7);
                        color: #ffffff;
                        font-size: 16px;
                        font-family: 'Bungee', monospace;
                        text-align: center;
                    ">
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="save-name-btn" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                            color: #000000;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: pointer;
                            font-family: 'Bungee', monospace;
                            transition: all 0.3s;
                        ">💾 Save & Continue</button>
                        
                        <button id="skip-name-btn" style="
                            background: transparent;
                            color: #888888;
                            border: 2px solid #555555;
                            padding: 12px 25px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-family: 'Bungee', monospace;
                            transition: all 0.3s;
                        ">Skip</button>
                    </div>
                </div>
            `,document.body.appendChild(r);const a=r.querySelector("#player-name-input"),i=r.querySelector("#player-email-input"),p=r.querySelector("#save-name-btn"),d=r.querySelector("#skip-name-btn");setTimeout(()=>a.focus(),100);const s=r.querySelector("#instagram-btn"),h=r.querySelector("#tiktok-btn"),g=r.querySelector("#twitter-btn");let u=null;const l=async m=>{try{const c=r.querySelector(`#${m.toLowerCase()}-btn`);c&&(c.textContent="Connecting...",c.disabled=!0);const f=await this.initiateOAuthFlow(m);if(f.success)u=m,[s,h,g].forEach(b=>{b&&(b.style.opacity="0.5")}),c&&(c.style.opacity="1",c.style.boxShadow="0 0 20px rgba(0, 255, 136, 0.5)",c.textContent=`✅ ${m} Connected`),f.profile.username&&(a.value=f.profile.username,a.placeholder=`${m} handle: ${f.profile.username}`),this.socialAuthData={platform:m,profile:f.profile,accessToken:f.accessToken};else throw new Error(f.error||"OAuth failed")}catch{const f=r.querySelector(`#${m.toLowerCase()}-btn`);f&&(f.textContent=`❌ Try ${m} Again`,f.disabled=!1,f.style.opacity="0.7");const b=document.createElement("div");b.style.cssText="color: #ff4444; font-size: 12px; margin-top: 5px; text-align: center;",b.textContent=`${m} connection failed. You can still enter your name manually.`,f.parentNode.appendChild(b),setTimeout(()=>b.remove(),5e3)}};s&&s.addEventListener("click",()=>l("Instagram")),h&&h.addEventListener("click",()=>l("TikTok")),g&&g.addEventListener("click",()=>l("Twitter"));const x=async()=>{const m=a.value.trim(),c=i.value.trim();if(!m){a.style.borderColor="#ff4444",a.placeholder="Name is required!";return}if(!c&&!u){i.style.borderColor="#ff4444",i.placeholder="Email or social media required!";return}try{const f=window.gameWrapper?.identityManager?.getCurrentPlayer(),b=f?.walletSuffix||f?.id?.slice(-4)?.toUpperCase()||"0000",y=`${m}#${b}`;if(window.gameWrapper&&window.gameWrapper.identityManager){const L=await window.gameWrapper.identityManager.updateWithCustomName(m)}if(window.playerProfile){const L={lastGameScore:t,lastGameMoves:window.neonDrop?.gameEngine?.moves||0,lastGameLevel:window.neonDrop?.gameEngine?.level||1,lastGameLines:window.neonDrop?.gameEngine?.linesCleared||0,lastGameTime:window.neonDrop?.gameEngine?.gameTime||0,gamesPlayedToday:(window.playerProfile.cache.status?.data?.games_played_today||0)+1,freeGamesUsed:window.playerProfile.cache.status?.data?.has_used_free_game||!1,displayName:y,email:c,lastPlayed:new Date().toISOString()};localStorage.setItem("blockzone_player_profile",JSON.stringify({displayName:y,email:c,playerId:o,walletSuffix:b,deviceFingerprint:window.gameWrapper.identityManager.generateFingerprint(),lastSession:Date.now(),gameStats:L}))}await this.submitScore(t,y,o)}catch{}document.body.removeChild(r),this.unblockGameInteraction(),n({playerName:m,playerEmail:c,socialPlatform:u})},w=()=>{document.body.removeChild(r),this.unblockGameInteraction(),n(!1)};p.addEventListener("click",x),d.addEventListener("click",w),a.addEventListener("keypress",m=>{m.key==="Enter"&&x()}),i.addEventListener("keypress",m=>{m.key==="Enter"&&x()}),document.addEventListener("keydown",function m(c){c.key==="Escape"&&(document.removeEventListener("keydown",m),w())})})}blockGameInteraction(){window.neonDrop&&window.neonDrop.gameEngine&&(window.neonDrop.gameEngine.inputBlocked=!0);const t=document.createElement("div");t.id="game-interaction-blocker",t.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 9999;
            pointer-events: all;
        `;const e=document.getElementById("game");e&&e.parentNode?e.parentNode.appendChild(t):document.body.appendChild(t)}unblockGameInteraction(){window.neonDrop&&window.neonDrop.gameEngine&&(window.neonDrop.gameEngine.inputBlocked=!1);const t=document.getElementById("game-interaction-blocker");t&&t.remove()}async initiateOAuthFlow(t){const e={Instagram:"your_instagram_client_id",TikTok:"your_tiktok_client_id",Twitter:"your_twitter_client_id"},o=`${window.location.origin}/auth/callback`;try{switch(t){case"Instagram":return await this.handleInstagramAuth(e.Instagram,o);case"TikTok":return await this.handleTikTokAuth(e.TikTok,o);case"Twitter":return await this.handleTwitterAuth(e.Twitter,o);default:throw new Error(`Unsupported platform: ${t}`)}}catch(n){return{success:!1,error:n.message}}}async handleInstagramAuth(t,e){const n=`https://api.instagram.com/oauth/authorize?client_id=${t}&redirect_uri=${encodeURIComponent(e)}&scope=user_profile,user_media&response_type=code`;return new Promise(r=>{const a=window.open(n,"instagram-auth","width=500,height=600,scrollbars=yes,resizable=yes"),i=setInterval(()=>{a.closed&&(clearInterval(i),r({success:!1,error:"User cancelled authentication"}))},1e3);window.addEventListener("message",async p=>{if(p.origin===window.location.origin&&p.data.type==="instagram-auth-success"){clearInterval(i),a.close();try{const s=await(await fetch("/api/auth/instagram/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:p.data.code})})).json();s.success?r({success:!0,accessToken:s.access_token,profile:{username:s.username,id:s.user_id,platform:"Instagram"}}):r({success:!1,error:"Failed to get access token"})}catch(d){r({success:!1,error:d.message})}}},{once:!0})})}async handleTikTokAuth(t,e){const n=`https://www.tiktok.com/auth/authorize/?client_key=${t}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(e)}`;return new Promise(r=>{const a=window.open(n,"tiktok-auth","width=500,height=600,scrollbars=yes,resizable=yes"),i=setInterval(()=>{a.closed&&(clearInterval(i),r({success:!1,error:"User cancelled authentication"}))},1e3);window.addEventListener("message",async p=>{if(p.origin===window.location.origin&&p.data.type==="tiktok-auth-success"){clearInterval(i),a.close();try{const s=await(await fetch("/api/auth/tiktok/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:p.data.code})})).json();s.success?r({success:!0,accessToken:s.access_token,profile:{username:s.username,id:s.user_id,platform:"TikTok"}}):r({success:!1,error:"Failed to get access token"})}catch(d){r({success:!1,error:d.message})}}},{once:!0})})}async handleTwitterAuth(t,e){const n=`https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${t}&redirect_uri=${encodeURIComponent(e)}&scope=${encodeURIComponent("tweet.read users.read")}&state=state&code_challenge=challenge&code_challenge_method=plain`;return new Promise(r=>{const a=window.open(n,"twitter-auth","width=500,height=600,scrollbars=yes,resizable=yes"),i=setInterval(()=>{a.closed&&(clearInterval(i),r({success:!1,error:"User cancelled authentication"}))},1e3);window.addEventListener("message",async p=>{if(p.origin===window.location.origin&&p.data.type==="twitter-auth-success"){clearInterval(i),a.close();try{const s=await(await fetch("/api/auth/twitter/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:p.data.code})})).json();s.success?r({success:!0,accessToken:s.access_token,profile:{username:s.username,id:s.user_id,platform:"Twitter"}}):r({success:!1,error:"Failed to get access token"})}catch(d){r({success:!1,error:d.message})}}},{once:!0})})}async showGameOverScreenInstant(t,e,o,n){this.log(this.LOG_LEVEL.INFO,"⚡ INSTANT: Showing game over screen with local data"),this.showWrapperInterface(t,e,o,n),this.overlayPerformance&&this.overlayPerformance.markInstantDisplay();const r=document.getElementById("game-over-wrapper");r&&this.showLoadingStates(r),this.log(this.LOG_LEVEL.INFO,"🚀 Starting immediate API call for leaderboard data"),this.startBackgroundAPICalls(t,o,n),this.log(this.LOG_LEVEL.INFO,"⚡ INSTANT: Game over screen displayed with local data")}startBackgroundAPICalls(t,e=null,o=null){if(this.cachedLeaderboardData&&this.cachedLeaderboardData.score===t)return this.updateLeaderboardInOverlay(this.cachedLeaderboardData),Promise.resolve(this.cachedLeaderboardData);if(this.apiCallInProgress&&this.currentGameScore===t)return this.log(this.LOG_LEVEL.WARN,"⏳ API call already in progress for this score, waiting..."),this.waitForApiResult();this.apiCallInProgress=!0,this.currentGameScore=t,this.log(this.LOG_LEVEL.INFO,"🚀 Starting API call for score:",t);const n=e||this.getPlayerName(),r=o||this.getPlayerId();return fetch(`${this.apiBase}/api/game-over`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({score:t,playerId:r,gameData:{playerName:n,gameType:"neon_drop",timestamp:Date.now()}})}).then(a=>a.json()).then(()=>fetch(`${this.apiBase}/api/leaderboard`)).then(a=>a.json()).then(a=>(this.log(this.LOG_LEVEL.INFO,"✅ Got leaderboard data:",a),this.log(this.LOG_LEVEL.DEBUG,"🔍 API Response structure:",{hasScores:!!a.scores,scoresLength:a.scores?.length,firstScore:a.scores?.[0],scoreKeys:a.scores?.[0]?Object.keys(a.scores[0]):[]}),a.scores&&a.scores.length>0&&this.log(this.LOG_LEVEL.DEBUG,"🔍 First 3 scores detail:",a.scores.slice(0,3).map((i,p)=>({position:p+1,display_name:i.display_name,player_id:i.player_id,id:i.id,score:i.score,allKeys:Object.keys(i)}))),this.cachedLeaderboardData={score:t,...a},this.pendingAPIResponse=a,this.hasLeaderboardDataChanged(a)?(this.updateLeaderboardInOverlay(a),this.lastLeaderboardData={...a}):this.log(this.LOG_LEVEL.DEBUG,"🔄 Leaderboard data unchanged, skipping update"),this.cachedLeaderboardData)).catch(a=>{throw this.log(this.LOG_LEVEL.ERROR,"❌ API call failed:",a),a}).finally(()=>{this.apiCallInProgress=!1,this.log(this.LOG_LEVEL.DEBUG,"🔓 API call guard reset")})}waitForApiResult(){return new Promise((t,e)=>{const o=setInterval(()=>{this.cachedLeaderboardData&&this.cachedLeaderboardData.score===this.currentGameScore?(clearInterval(o),this.log(this.LOG_LEVEL.INFO,"📊 API result ready, returning cached data"),t(this.cachedLeaderboardData)):this.apiCallInProgress||(clearInterval(o),this.log(this.LOG_LEVEL.ERROR,"❌ API call failed while waiting"),e(new Error("API call failed")))},100);setTimeout(()=>{clearInterval(o),this.log(this.LOG_LEVEL.ERROR,"❌ Timeout waiting for API result"),e(new Error("API call timeout"))},1e4)})}updateLeaderboardInOverlay(t){const e=document.getElementById("game-over-wrapper");if(!e){this.log(this.LOG_LEVEL.ERROR,"❌ No game-over-wrapper found");return}const o=e.querySelector("#leaderboardContent");if(!o){this.log(this.LOG_LEVEL.ERROR,"❌ No leaderboardContent found");return}const n=t.scores?t.scores.slice(0,3):[];this.log(this.LOG_LEVEL.DEBUG,"🏆 Top 3 players:",n);const r=this.getPlayerId();this.log(this.LOG_LEVEL.DEBUG,"🏆 Current player ID for comparison:",r);let a="";const i=n[0],p=i?i.display_name:"No Data",d=i&&i.score?i.score.toLocaleString():"No Data",s=i&&(i.player_id||i.id)||"",h=s===r;a+=`<div style="color: ${h?"#00ff88":"#ffffff"}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥇 1st: ${p} - ${d} pts${h?" ← You":""}
        </div>`;const l=n[1],x=l?l.display_name:"No Data",w=l&&l.score?l.score.toLocaleString():"No Data",m=l&&(l.player_id||l.id)||"",c=m===r;a+=`<div style="color: ${c?"#00ff88":"#ffffff"}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥈 2nd: ${x} - ${w} pts${c?" ← You":""}
        </div>`;const y=n[2],L=y?y.display_name:"No Data",k=y&&y.score?y.score.toLocaleString():"No Data",E=y&&(y.player_id||y.id)||"",v=E===r;a+=`<div style="color: ${v?"#00ff88":"#ffffff"}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥉 3rd: ${L} - ${k} pts${v?" ← You":""}
        </div>`,a+=`<div style="margin-top: 10px; color: #00ff88; font-size: 12px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,255,0,0.1); border-radius: 4px;">
            Total Players: ${t.scores?t.scores.length:"No Data"}
        </div>`,this.log(this.LOG_LEVEL.DEBUG,"🏆 Player ID comparisons:",{currentPlayerId:r,player1Id:s,player2Id:m,player3Id:E,isPlayer1Current:h,isPlayer2Current:c,isPlayer3Current:v}),o.innerHTML=a,this.log(this.LOG_LEVEL.INFO,"✅ Leaderboard updated with real data")}updateUIWithRealTimeData(t,e,o,n){const r=document.getElementById("game-over-wrapper");if(r){if(t.leaderboard){let a=t.leaderboard.top3,i=t.leaderboard.totalPlayers;!a&&t.leaderboard.scores&&(a=t.leaderboard.scores.slice(0,3),i=t.leaderboard.scores.length),(!a||a.length===0)&&(a=[{name:"Player 1",score:1e3,id:"player1"},{name:"Player 2",score:800,id:"player2"},{name:"Player 3",score:600,id:"player3"}],i=3),this.updateOverlayLeaderboard({top3:a,playerRank:t.scoreSubmission?.newRank||"Unknown",totalPlayers:i,freshness:t.metadata?.dataFreshness||"real-time",responseTime:t.metadata?.responseTime||"unknown",scope:t.metadata?.scope||"global",region:t.metadata?.region||"global"})}if(t.playerAccess){const a=r.querySelector("#playAgainBtn");a&&this.updatePlayAgainButtonWithRealTimeData(a,t.playerAccess)}t.playerStats&&this.updatePlayerStatsDisplay(t.playerStats),this.showPerformanceMetrics(t.metadata)}}updateOverlayLeaderboard({top3:t,playerRank:e,totalPlayers:o,freshness:n,responseTime:r,scope:a,region:i}){const p=document.getElementById("game-over-wrapper");if(!p)return;const d=p.querySelector("#leaderboardContent");if(d){let g="";t&&t.length>0?t.forEach((u,l)=>{const x=l===0?"🥇":l===1?"🥈":"🥉",w=u.player_id===this.getPlayerId()||u.id===this.getPlayerId(),m=w?"#00ff88":"#ffffff",c=w?"bold":"normal",f=w?" ← You":"";g+=`
                        <div style="
                            display: flex !important;
                            justify-content: space-between !important;
                            margin-bottom: 8px !important;
                            font-size: 14px !important;
                            color: ${m} !important;
                            font-weight: ${c} !important;
                            font-family: 'Bungee', monospace !important;
                        ">
                            <span>${x} ${l+1}st: ${u.display_name||u.name||"Unknown"} - ${(u.score||0).toLocaleString()} pts${f}</span>
                        </div>
                    `}):g=`
                    <div style="color: #888; font-size: 12px;">
                        No leaderboard data available
                    </div>
                `,e&&o&&(g+=`
                    <div style="
                        margin-top: 10px !important;
                        padding: 8px !important;
                        background: rgba(0, 255, 0, 0.1) !important;
                        border: 1px solid #00ff88 !important;
                        border-radius: 4px !important;
                        font-size: 12px !important;
                        color: #00ff88 !important;
                    ">
                        <strong>Your Rank:</strong> #${e} of ${o.toLocaleString()}
                    </div>
                `),d.innerHTML=g}const s=p.querySelector(".freshness-indicator");if(s){const g=n==="real-time"?"⚡":"🟢";s.textContent=`${g} ${n} (${r})`,s.className=`freshness-indicator ${n==="real-time"?"real-time":"cached"}`}const h=p.querySelector(".leaderboard-title");if(h){const g=a==="regional"?` (${i.toUpperCase()})`:"";h.textContent=`🏆 Top Players${g}`}}updatePlayAgainButtonWithRealTimeData(t,e){e.canPlayAgain?this.updatePlayAgainButton(t,"enabled","🎮 Play Again ⚡"):this.updatePlayAgainButton(t,"disabled",`💰 ${e.reason} ❌`)}updatePlayerStatsDisplay(t){const e=document.getElementById("game-over-wrapper");if(!e)return;const o=e.querySelector(".player-stats");o&&t&&(o.innerHTML=`
                <div style="
                    margin-top: 10px !important;
                    padding: 8px !important;
                    background: rgba(0, 212, 255, 0.1) !important;
                    border: 1px solid #00d4ff !important;
                    border-radius: 4px !important;
                    font-size: 12px !important;
                    color: #00d4ff !important;
                ">
                    <strong>Your Stats:</strong><br>
                    Games Played: ${t.gamesPlayed}<br>
                    Best Score: ${t.bestScore.toLocaleString()}<br>
                </div>
            `)}showPerformanceMetrics(t){if(!t)return;const e=document.getElementById("game-over-wrapper");if(e){const o=e.querySelector(".performance-indicator");o&&(o.textContent=`⚡ ${t.responseTime} | ${t.dataFreshness}`)}}getPlayerRegion(){if(window.gameWrapper?.identityManager?.getPlayerRegion)return window.gameWrapper.identityManager.getPlayerRegion();try{return navigator.language.split("-")[1]?.toLowerCase()||"global"}catch{return"global"}}getGameData(){const t={gameType:"neon_drop",timestamp:Date.now(),version:"1.0.0"};return window.neonDrop&&(t.seed=window.neonDrop.dailySeed,t.seedDate=window.neonDrop.seedDate),window.neonDrop?.engine?.getPlayTime&&(t.playTime=window.neonDrop.engine.getPlayTime()),t}async updateGameOverUIWithFreshData(t,e,o){throw new Error("Must fix /api/game-over endpoint")}showLoadingStates(t){const e=t.querySelector("#leaderboardContent");e&&(e.innerHTML=`
                <div style="color: #888; font-size: 12px;">
                    🔄 Loading leaderboard...
                </div>
            `);const o=t.querySelector("#playAgainBtn");o&&(o.textContent="🔄 Loading...",o.disabled=!0)}updateDataFreshnessIndicators(t,e,o="all"){const n={"⚡":"Just fetched","🟢":"Cached (recent)","🟡":"Cached (older)","❌":"Network issue"};if(o==="all"||o==="leaderboard"){const r=t.querySelector(".leaderboard-title");r&&(r.textContent=`🏆 Leaderboard ${e}`)}if(o==="all"||o==="access"){const r=t.querySelector("#playAgainBtn");r&&!r.disabled&&(r.textContent=`🎮 Play Again ${e}`)}}async showGameOverScreen(t,e,o=!1,n,r){if(this.showWrapperInterface(t,e,n,r),!o)try{const a=await this.submitScore(t,n,r);throw new Error("Must fix /api/game-over endpoint")}catch{throw new Error("Must fix /api/game-over endpoint")}}async submitScore(t,e,o){throw new Error("Must fix /api/game-over endpoint")}showWrapperInterface(t,e,o,n){this.overlayPerformance={startTime:Date.now(),markInstantDisplay(){},markDataLoaded(l){const x=Date.now()-this.startTime}};const r=document.getElementById("game-over-wrapper");r&&r.remove();const a=document.createElement("div");a.id="game-over-overlay",a.style.cssText=`
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            animation: fadeIn 0.8s ease-out !important;
            font-family: 'Bungee', monospace !important;
            padding: 10px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        `,a.innerHTML=`
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: scale(0.8) translateY(30px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
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
                
                /* EXACT NEON DROP CHICLET ANIMATION FROM PAYWALL */
                @keyframes chicletEntrance {
                    0% { transform: translateY(-30px) scale(0.3) rotate(10deg); opacity: 0; }
                    60% { transform: translateY(2px) scale(1.1) rotate(-3deg); opacity: 0.8; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }
                
                .netflix-chiclet-title {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0px;
                    margin-bottom: 30px;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
                }

                .chiclet-word {
                    display: flex;
                    gap: 0px;
                }

                .chiclet-spacer {
                    width: 19px;
                    height: 19px;
                }

                .chiclet {
                    width: 19px !important;
                    height: 19px !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-family: 'Bungee', monospace;
                    font-weight: bold;
                    font-size: 23px;
                    line-height: 1;
                    border-radius: 2px;
                    position: relative;
                    text-align: center;
                    text-shadow: 1px 1px 0 #000000;
                    transform: translateY(-24px) scale(0.3);
                    opacity: 0;
                    transition: transform 0.3s ease;
                    animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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
                
                .game-over-card { animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .neon-title { animation: neonGlow 2s ease-in-out infinite; }
                .score-display { animation: scorePulse 3s ease-in-out infinite; }
                .info-line { animation: floatUp 0.6s ease-out forwards; }
                .chiclet { animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                
                .info-line:nth-child(1) { animation-delay: 0.1s; }
                .info-line:nth-child(2) { animation-delay: 0.2s; }
                .info-line:nth-child(3) { animation-delay: 0.3s; }
                .info-line:nth-child(4) { animation-delay: 0.4s; }
                .info-line:nth-child(5) { animation-delay: 0.5s; }
                .info-line:nth-child(6) { animation-delay: 0.6s; }
                
                .chiclet:nth-child(1) { animation-delay: 0.1s; }
                .chiclet:nth-child(2) { animation-delay: 0.2s; }
                .chiclet:nth-child(3) { animation-delay: 0.3s; }
                .chiclet:nth-child(4) { animation-delay: 0.4s; }
                .chiclet:nth-child(5) { animation-delay: 0.5s; }
                .chiclet:nth-child(6) { animation-delay: 0.6s; }
                .chiclet:nth-child(7) { animation-delay: 0.7s; }
                .chiclet:nth-child(8) { animation-delay: 0.8s; }
                
                /* Responsive design */
                @media (max-height: 600px) {
                    .game-over-card { max-height: 90vh !important; padding: 15px !important; }
                }
                @media (max-width: 480px) {
                    .game-over-card { width: 95% !important; padding: 15px !important; }
                }
                
                /* Freshness indicator */
                .freshness-indicator {
                    font-size: 0.8em !important;
                    color: #666 !important;
                    margin-left: 8px !important;
                    font-family: 'Bungee', monospace !important;
                }
                .freshness-indicator.real-time {
                    color: #00ff00 !important;
                    text-shadow: 0 0 5px #00ff00 !important;
                }
                .freshness-indicator.cached {
                    color: #ffaa00 !important;
                    text-shadow: 0 0 5px #ffaa00 !important;
                }
                
                /* Performance indicator */
                .performance-indicator {
                    position: absolute !important;
                    top: 8px !important;
                    right: 8px !important;
                    font-size: 9px !important;
                    color: #00d4ff !important;
                    opacity: 0.7 !important;
                    font-family: 'Bungee', monospace !important;
                }
            </style>
            
            <!-- SIMPLIFIED GAME OVER CARD -->
            <div class="game-over-card" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                border: 2px solid #00d4ff !important;
                border-radius: 15px !important;
                padding: 25px !important;
                max-width: calc(100vw - 40px) !important;
                width: calc(100vw - 40px) !important;
                max-height: calc(100vh - 120px) !important;
                text-align: center !important;
                box-shadow: 0 0 25px rgba(0, 212, 255, 0.3) !important;
                position: relative !important;
                overflow: hidden !important;
                margin: auto !important;
                backdrop-filter: blur(10px) !important;
            ">
                <!-- Chiclet Header -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        margin-bottom: 8px !important;
                        font-family: 'Bungee', monospace !important;
                    ">
                        <div style="display: flex !important; margin-right: 8px !important;">
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">N</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">E</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">O</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">N</div>
                        </div>
                        <div style="width: 8px !important;"></div>
                        <div style="display: flex !important;">
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">D</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">R</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">O</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">P</div>
                        </div>
                    </div>
                    <div style="
                        font-size: 10px !important;
                        color: #888888 !important;
                        font-family: 'Bungee', monospace !important;
                    ">Game Results</div>
                </div>
                
                <!-- Score & Rank -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        font-size: 36px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        margin-bottom: 8px !important;
                        text-shadow: 0 0 15px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                    " class="score-display">${t.toLocaleString()}</div>
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        margin-bottom: 4px !important;
                    " class="info-line">👤 ${o}</div>
                    <div style="
                        font-size: 12px !important;
                        color: #00ff88 !important;
                        font-family: 'Bungee', monospace !important;
                    " class="info-line">⏰ Next Tournament: 11:15 PM EST</div>
                </div>
                
                <!-- Challenge Buttons (Prominent) -->
                <div style="
                    background: rgba(0, 255, 136, 0.08) !important;
                    border: 1px solid #00ff88 !important;
                    border-radius: 12px !important;
                    padding: 15px !important;
                    margin-bottom: 20px !important;
                ">
                    <div style="
                        font-size: 16px !important;
                        color: #00ff88 !important;
                        margin-bottom: 12px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⚡ CHALLENGE FRIENDS</div>
                    
                    <div style="
                        display: flex !important;
                        justify-content: space-around !important;
                        gap: 10px !important;
                        margin-bottom: 12px !important;
                    ">
                        <button id="challenge2Btn" style="
                            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%) !important;
                            border: none !important;
                            border-radius: 8px !important;
                            padding: 12px 8px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            flex: 1 !important;
                            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3) !important;
                        "
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 20px rgba(0, 255, 136, 0.5)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(0, 255, 136, 0.3)'"
                        class="info-line">
                            <div style="
                                font-size: 14px !important;
                                color: #000000 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💰 $2</div>
                            <div style="
                                font-size: 10px !important;
                                color: #000000 !important;
                                font-family: 'Bungee', monospace !important;
                            ">Win $3.60</div>
                        </button>
                        
                        <button id="challenge5Btn" style="
                            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%) !important;
                            border: none !important;
                            border-radius: 8px !important;
                            padding: 12px 8px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            flex: 1 !important;
                            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3) !important;
                        "
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 20px rgba(0, 255, 136, 0.5)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(0, 255, 136, 0.3)'"
                        class="info-line">
                            <div style="
                                font-size: 14px !important;
                                color: #000000 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💎 $5</div>
                            <div style="
                                font-size: 10px !important;
                                color: #000000 !important;
                                font-family: 'Bungee', monospace !important;
                            ">Win $9.00</div>
                        </button>
                    </div>
                </div>
                
                <!-- View Full Profile Button -->
                <button id="viewProfileBtn" style="
                    background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                    color: #000000 !important;
                    border: none !important;
                    padding: 12px 20px !important;
                    border-radius: 8px !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    font-family: 'Bungee', monospace !important;
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3) !important;
                    width: 100% !important;
                    margin-bottom: 15px !important;
                "
                onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 20px rgba(0, 212, 255, 0.5)'"
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(0, 212, 255, 0.3)'"
                class="info-line">
                    📊 VIEW FULL PROFILE & LEADERBOARD
                </button>
                
                <!-- Action Buttons -->
                <div style="
                    display: flex !important;
                    gap: 10px !important;
                    justify-content: center !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                        color: #ffffff !important;
                        border: none !important;
                        padding: 10px 16px !important;
                        border-radius: 6px !important;
                        font-size: 12px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 15px rgba(255, 107, 107, 0.3) !important;
                        flex: 1 !important;
                    "
                    onmouseover="this.style.transform='scale(1.03)'; this.style.boxShadow='0 0 20px rgba(255, 107, 107, 0.5)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(255, 107, 107, 0.3)'"
                    class="info-line">
                        🔄 PLAY AGAIN
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 1px solid #ffaa00 !important;
                        padding: 10px 16px !important;
                        border-radius: 6px !important;
                        font-size: 12px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        text-shadow: 0 0 8px #ffaa00 !important;
                        box-shadow: 0 0 10px rgba(255, 170, 0, 0.2) !important;
                        flex: 1 !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(255, 170, 0, 0.1)'; this.style.boxShadow='0 0 15px rgba(255, 170, 0, 0.4)'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.boxShadow='0 0 10px rgba(255, 170, 0, 0.2)'"
                    class="info-line">
                        🏠 HOME
                    </button>
                </div>
            </div>
        `;try{document.body.appendChild(a),this.log(this.LOG_LEVEL.INFO,"✅ Overlay successfully added to document.body")}catch(l){this.log(this.LOG_LEVEL.ERROR,"❌ Error adding overlay to DOM:",l)}const i=a.querySelector("#playAgainBtn");i&&i.addEventListener("click",async l=>{l.stopPropagation(),!i.disabled&&(this.leaderboardInstance&&this.leaderboardInstance.isVisible&&this.leaderboardInstance.hide(),this.hide(),this.eventBus.emit("startGame"))});const p=a.querySelector("#homeBtn");p&&p.addEventListener("click",()=>{this.hide(),window.location.href="/"});const d=a.querySelector("#viewProfileBtn");d&&d.addEventListener("click",l=>{l.stopPropagation(),this.showStyledLeaderboard()});const s=a.querySelector("#challenge2Btn");s&&s.addEventListener("click",l=>{l.stopPropagation(),this.createChallenge(t,2)});const h=a.querySelector("#challenge5Btn");h&&h.addEventListener("click",l=>{l.stopPropagation(),this.createChallenge(t,5)});const g=a.querySelector("#shareScoreBtn");g&&g.addEventListener("click",l=>{l.stopPropagation(),this.shareScore(t)});const u=a.querySelector("#gamesBtn");u&&u.addEventListener("click",l=>{l.stopPropagation(),this.hide(),window.location.href="/games/"})}showChallengeCreation(t){const e=document.createElement("div");e.id="challenge-modal",e.style.cssText=`
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            font-family: 'Bungee', monospace !important;
        `,e.innerHTML=`
            <div style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border: 2px solid #00ff88 !important;
                border-radius: 20px !important;
                padding: 30px !important;
                max-width: 500px !important;
                width: 90% !important;
                text-align: center !important;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.3) !important;
            ">
                <div style="
                    font-size: 24px !important;
                    color: #00ff88 !important;
                    margin-bottom: 20px !important;
                    font-weight: bold !important;
                ">⚡ CREATE CHALLENGE</div>
                
                <div style="
                    font-size: 16px !important;
                    color: #ffffff !important;
                    margin-bottom: 20px !important;
                ">Challenge others with your score of <span style="color: #00ff88; font-weight: bold;">${t.toLocaleString()}</span></div>
                
                <div style="
                    display: flex !important;
                    gap: 15px !important;
                    justify-content: center !important;
                    margin-bottom: 20px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="challenge2Btn" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 15px 20px !important;
                        border-radius: 10px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        💰 $2 Challenge<br><span style="font-size: 12px;">Winner gets $3.60</span>
                    </button>
                    
                    <button id="challenge5Btn" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 15px 20px !important;
                        border-radius: 10px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        💎 $5 Challenge<br><span style="font-size: 12px;">Winner gets $9.00</span>
                    </button>
                </div>
                
                <button id="closeChallengeBtn" style="
                    background: none !important;
                    color: #888888 !important;
                    border: 1px solid #555555 !important;
                    padding: 10px 20px !important;
                    border-radius: 8px !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    font-family: 'Bungee', monospace !important;
                "
                onmouseover="this.style.color='#ffffff'; this.style.borderColor='#888888'"
                onmouseout="this.style.color='#888888'; this.style.borderColor='#555555'">
                    Cancel
                </button>
            </div>
        `,e.querySelector("#challenge2Btn").addEventListener("click",()=>{this.createChallenge(t,2),e.remove()}),e.querySelector("#challenge5Btn").addEventListener("click",()=>{this.createChallenge(t,5),e.remove()}),e.querySelector("#closeChallengeBtn").addEventListener("click",()=>{e.remove()}),document.body.appendChild(e)}createChallenge(t,e){const o=document.createElement("div");o.style.cssText=`
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
            color: #000000 !important;
            padding: 15px 20px !important;
            border-radius: 10px !important;
            font-family: 'Bungee', monospace !important;
            font-weight: bold !important;
            z-index: 9999999 !important;
            animation: slideIn 0.5s ease-out !important;
        `,o.innerHTML=`
            <style>
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            ✅ ${e} Challenge Created!<br>
            <span style="font-size: 12px;">Share with friends to start competing</span>
        `,document.body.appendChild(o),setTimeout(()=>{o.remove()},3e3)}shareScore(t){const e=`I just scored ${t.toLocaleString()} points in NeonDrop on BlockZone Lab! 🎮 Can you beat my score? Play at blockzonelab.com`;navigator.share?navigator.share({title:"My NeonDrop Score",text:e,url:"https://blockzonelab.com"}).catch(o=>{this.fallbackShare(e)}):this.fallbackShare(e)}fallbackShare(t){navigator.clipboard.writeText(t).then(()=>{const e=document.createElement("div");e.style.cssText=`
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                color: #000000 !important;
                padding: 15px 20px !important;
                border-radius: 10px !important;
                font-family: 'Bungee', monospace !important;
                font-weight: bold !important;
                z-index: 9999999 !important;
                animation: slideIn 0.5s ease-out !important;
            `,e.innerHTML=`
                <style>
                    @keyframes slideIn { 
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                </style>
                📋 Score copied to clipboard!<br>
                <span style="font-size: 12px;">Paste it anywhere to share</span>
            `,document.body.appendChild(e),setTimeout(()=>{e.remove()},3e3)})}getPlayerName(){if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Getting player name from multiple sources..."),window.identityManager&&window.identityManager.getPlayerName){const t=window.identityManager.getPlayerName();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got name from identityManager:",t),t&&t!=="Player")return t}if(window.gameWrapper&&window.gameWrapper.getPlayerName){const t=window.gameWrapper.getPlayerName();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got name from gameWrapper:",t),t&&t!=="Player")return t}if(this.identitySystem&&this.identitySystem.getPlayerName){const t=this.identitySystem.getPlayerName();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got name from this.identitySystem:",t),t&&t!=="Player")return t}try{const t=localStorage.getItem("blockzone_player_data");if(t){const e=JSON.parse(t);if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got name from localStorage:",e.display_name),e.display_name)return e.display_name}}catch(t){this.log(this.LOG_LEVEL.ERROR,"❌ Error reading from localStorage:",t)}return this.log(this.LOG_LEVEL.WARN,"⚠️ No player name found, using default"),"Player"}updatePlayAgainButton(t,e,o){e==="enabled"?(t.disabled=!1,t.style.color="#00d4ff",t.style.borderColor="#00d4ff",t.style.cursor="pointer",t.style.opacity="1",t.style.textShadow="0 0 10px #00d4ff",t.style.boxShadow="0 0 15px rgba(0, 212, 255, 0.3)",t.onmouseover=()=>{t.style.backgroundColor="rgba(0, 212, 255, 0.1)",t.style.boxShadow="0 0 25px rgba(0, 212, 255, 0.5)"},t.onmouseout=()=>{t.style.backgroundColor="transparent",t.style.boxShadow="0 0 15px rgba(0, 212, 255, 0.3)"}):(t.disabled=!0,t.style.color="#666666",t.style.borderColor="#666666",t.style.cursor="not-allowed",t.style.opacity="0.5",t.style.textShadow="0 0 10px #666666",t.style.boxShadow="0 0 15px rgba(102, 102, 102, 0.3)",t.onmouseover=null,t.onmouseout=null),t.textContent=o}getPlayerId(){if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Getting player ID from multiple sources..."),window.identityManager&&window.identityManager.getPlayerId){const t=window.identityManager.getPlayerId();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got ID from identityManager:",t),t&&t!=="unknown")return t}if(window.gameWrapper&&window.gameWrapper.getPlayerId){const t=window.gameWrapper.getPlayerId();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got ID from gameWrapper:",t),t&&t!=="unknown")return t}if(this.identitySystem&&this.identitySystem.getPlayerId){const t=this.identitySystem.getPlayerId();if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got ID from this.identitySystem:",t),t&&t!=="unknown")return t}try{const t=localStorage.getItem("blockzone_player_data");if(t){const e=JSON.parse(t);if(this.log(this.LOG_LEVEL.DEBUG,"🔍 Got ID from localStorage:",e.player_id),e.player_id)return e.player_id}}catch(t){this.log(this.LOG_LEVEL.ERROR,"❌ Error reading from localStorage:",t)}return this.log(this.LOG_LEVEL.WARN,"⚠️ No player ID found, using default"),"unknown"}hide(){const t=document.getElementById("game-over-overlay");t&&t.remove();const e=document.getElementById("game-over-wrapper");e&&e.remove(),this.isVisible=!1}async showStyledLeaderboard(){if(this.leaderboardInstance&&this.leaderboardInstance.isVisible){this.leaderboardInstance.hide();return}try{const{LeaderboardDisplay:t}=await import("/shared/components/LeaderboardDisplay.js");this.leaderboardInstance=new t,await this.leaderboardInstance.show()}catch{this.showLeaderboardError("Failed to load leaderboard component. Please try again.")}}showLeaderboardError(t){const e=document.getElementById("leaderboard-error");e&&e.remove();const o=document.createElement("div");o.id="leaderboard-error",o.className="leaderboard-overlay",o.innerHTML=`
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes neonGlow { 
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
                }
                .leaderboard-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(0, 0, 0, 0.9) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 10000000 !important;
                    animation: fadeIn 0.5s ease-out !important;
                }
                .error-container {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                    border-radius: 20px !important;
                    padding: 40px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    text-align: center !important;
                    box-shadow: 0 20px 60px rgba(255, 68, 68, 0.3), 0 0 40px rgba(255, 68, 68, 0.1) !important;
                    border: 1px solid rgba(255, 68, 68, 0.2) !important;
                    color: white !important;
                    font-family: 'Bungee', monospace !important;
                }
                .error-icon {
                    font-size: 48px !important;
                    margin-bottom: 20px !important;
                }
                .error-title {
                    font-size: 24px !important;
                    font-weight: bold !important;
                    color: #ff4444 !important;
                    margin-bottom: 15px !important;
                    animation: neonGlow 2s ease-in-out infinite !important;
                }
                .error-message {
                    font-size: 16px !important;
                    color: #cccccc !important;
                    margin-bottom: 25px !important;
                    line-height: 1.5 !important;
                }
                .action-btn {
                    padding: 12px 24px !important;
                    border: none !important;
                    border-radius: 8px !important;
                    font-family: 'Bungee', monospace !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    min-width: 120px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                }
                .action-btn.secondary {
                    background: linear-gradient(45deg, #666, #444) !important;
                    color: #fff !important;
                    border: 2px solid #666 !important;
                }
                .action-btn.secondary:hover {
                    background: linear-gradient(45deg, #777, #555) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px rgba(136, 136, 136, 0.4) !important;
                }
            </style>
            
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Leaderboard Error</div>
                <div class="error-message">${t}</div>
                <button id="closeErrorBtn" class="action-btn secondary">Close</button>
            </div>
        `,document.body.appendChild(o),document.getElementById("closeErrorBtn").addEventListener("click",()=>{o.remove()}),o.addEventListener("click",n=>{n.target===o&&o.remove()})}async getIdentityDataOnce(){const t=Date.now();if(this.identityCache&&t-this.cacheTimestamp<this.CACHE_DURATION)return this.log(this.LOG_LEVEL.DEBUG,"🚀 Using cached identity data (0ms lookup time)"),this.identityCache;this.log(this.LOG_LEVEL.INFO,"🔄 Fetching identity data once for entire game-over sequence...");const[e,o]=await Promise.all([this.getPlayerName(),this.getPlayerId()]);return this.identityCache={playerName:e,playerID:o},this.cacheTimestamp=t,this.log(this.LOG_LEVEL.INFO,"✅ Identity data cached - all subsequent calls will be instant"),this.identityCache}createOverlayWithHardcodedMedals(t){this.log(this.LOG_LEVEL.INFO,"⚡ COMPACT: Creating overlay that fits viewport height");const o=document.getElementById("game-over-wrapper");o&&o.remove();const n=document.createElement("div");n.id="game-over-wrapper",n.className="game-over-overlay",n.style.cssText=`
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            animation: fadeIn 0.8s ease-out !important;
            font-family: 'Bungee', monospace !important;
            padding: 15px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        `,n.innerHTML=`
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: scale(0.8) translateY(30px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
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
                
                .game-over-card { animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .neon-title { animation: neonGlow 2s ease-in-out infinite; }
                .score-display { animation: scorePulse 3s ease-in-out infinite; }
                .info-line { animation: floatUp 0.6s ease-out forwards; }
                .chiclet { animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                
                .info-line:nth-child(1) { animation-delay: 0.1s; }
                .info-line:nth-child(2) { animation-delay: 0.2s; }
                .info-line:nth-child(3) { animation-delay: 0.3s; }
                .info-line:nth-child(4) { animation-delay: 0.4s; }
                .info-line:nth-child(5) { animation-delay: 0.5s; }
                .info-line:nth-child(6) { animation-delay: 0.6s; }
                
                .chiclet:nth-child(1) { animation-delay: 0.1s; }
                .chiclet:nth-child(2) { animation-delay: 0.2s; }
                .chiclet:nth-child(3) { animation-delay: 0.3s; }
                .chiclet:nth-child(4) { animation-delay: 0.4s; }
                .chiclet:nth-child(5) { animation-delay: 0.5s; }
                .chiclet:nth-child(6) { animation-delay: 0.6s; }
                .chiclet:nth-child(7) { animation-delay: 0.7s; }
                .chiclet:nth-child(8) { animation-delay: 0.8s; }
                
                /* Responsive design */
                @media (max-height: 600px) {
                    .game-over-card { max-height: 90vh !important; padding: 15px !important; }
                }
                @media (max-width: 480px) {
                    .game-over-card { width: 95% !important; padding: 15px !important; }
                }
                
                /* Freshness indicator */
                .freshness-indicator {
                    font-size: 0.8em !important;
                    color: #666 !important;
                    margin-left: 8px !important;
                    font-family: 'Bungee', monospace !important;
                }
                .freshness-indicator.real-time {
                    color: #00ff00 !important;
                    text-shadow: 0 0 5px #00ff00 !important;
                }
                .freshness-indicator.cached {
                    color: #ffaa00 !important;
                    text-shadow: 0 0 5px #ffaa00 !important;
                }
                
                /* Performance indicator */
                .performance-indicator {
                    position: absolute !important;
                    top: 8px !important;
                    right: 8px !important;
                    font-size: 9px !important;
                    color: #00d4ff !important;
                    opacity: 0.7 !important;
                    font-family: 'Bungee', monospace !important;
                }
            </style>
            
            <!-- SIMPLIFIED GAME OVER CARD -->
            <div class="game-over-card" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                border: 2px solid #00d4ff !important;
                border-radius: 15px !important;
                padding: 25px !important;
                max-width: calc(100vw - 40px) !important;
                width: calc(100vw - 40px) !important;
                max-height: calc(100vh - 120px) !important;
                text-align: center !important;
                box-shadow: 0 0 25px rgba(0, 212, 255, 0.3) !important;
                position: relative !important;
                overflow: hidden !important;
                margin: auto !important;
                backdrop-filter: blur(10px) !important;
            ">
                <!-- Chiclet Header -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        margin-bottom: 8px !important;
                        font-family: 'Bungee', monospace !important;
                    ">
                        <div style="display: flex !important; margin-right: 8px !important;">
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">N</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">E</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">O</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                                color: #000000 !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(0, 212, 255, 0.5) !important;
                            ">N</div>
                        </div>
                        <div style="width: 8px !important;"></div>
                        <div style="display: flex !important;">
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">D</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">R</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">O</div>
                            <div class="chiclet" style="
                                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                                color: #ffffff !important;
                                width: 19px !important;
                                height: 19px !important;
                                padding: 0 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 0 1px !important;
                                border-radius: 4px !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                box-shadow: 0 0 8px rgba(255, 107, 107, 0.5) !important;
                            ">P</div>
                        </div>
                    </div>
                    <div style="
                        font-size: 10px !important;
                        color: #888888 !important;
                        font-family: 'Bungee', monospace !important;
                    ">Game Results</div>
                </div>
                
                <!-- Score & Rank -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        font-size: 36px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        margin-bottom: 8px !important;
                        text-shadow: 0 0 15px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                    " class="score-display">${t.toLocaleString()}</div>
                    <div id="playerInfoSection" style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        margin-bottom: 4px !important;
                    " class="info-line">👤 Loading player...</div>
                    <div style="
                        font-size: 12px !important;
                        color: #00ff88 !important;
                        font-family: 'Bungee', monospace !important;
                    " class="info-line">⏰ Next Tournament: 11:15 PM EST</div>
                </div>
                
                <!-- INTEGRATED LEADERBOARD SECTION -->
                <div id="leaderboardSection" style="
                    background: rgba(0, 212, 255, 0.1) !important;
                    border: 1px solid #00d4ff !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 12px !important;
                    position: relative !important;
                ">
                    <!-- Performance indicator -->
                    <div class="performance-indicator">⚡ Loading...</div>
                    
                    <div style="
                        font-size: 18px !important;
                        color: #00d4ff !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">
                        🏆 LEADERBOARD
                        <span class="freshness-indicator">🔄 Loading...</span>
                    </div>
                    
                    <div id="leaderboardContent" style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        text-align: center !important;
                    ">
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥇 1st: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥈 2nd: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥉 3rd: No Data - No Data pts
                        </div>
                        <div style="margin-top: 10px; color: #00ff88; font-size: 12px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,255,0,0.1); border-radius: 4px;">
                            Total Players: No Data
                        </div>
                    </div>
                    
                    <button id="viewLeaderboardBtn" style="
                        background: none !important;
                        color: #00d4ff !important;
                        border: 1px solid #00d4ff !important;
                        padding: 8px 16px !important;
                        border-radius: 8px !important;
                        font-size: 12px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        margin-top: 10px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'"
                    class="info-line">
                        View Full Leaderboard
                    </button>
                </div>
                
                <!-- CHALLENGE FRIENDS SECTION -->
                <div style="
                    background: rgba(0, 255, 136, 0.1) !important;
                    border: 1px solid #00ff88 !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 15px !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #00ff88 !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⚡ CHALLENGE FRIENDS</div>
                    
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        margin-bottom: 15px !important;
                        font-family: 'Bungee', monospace !important;
                    ">Save this game and challenge others!</div>
                    
                    <div style="
                        display: flex !important;
                        justify-content: space-around !important;
                        margin-bottom: 15px !important;
                        flex-wrap: wrap !important;
                        gap: 10px !important;
                    ">
                        <button id="challenge2Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💰 $2 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Winner gets $3.60</div>
                        </button>
                        
                        <button id="challenge5Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💎 $5 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Your score: ${t.toLocaleString()}</div>
                        </div>
                        
                        <!-- RIGHT COLUMN: CHALLENGE BUTTONS -->
                        <div style="
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                            padding: 15px !important;
                        ">
                            <button id="challenge2Btn" style="
                                background: rgba(0, 255, 136, 0.2) !important;
                                border: 2px solid #00ff88 !important;
                                border-radius: 8px !important;
                                padding: 12px !important;
                                text-align: center !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                min-width: 120px !important;
                            "
                            onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                            onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                            class="info-line">
                                <div style="
                                    font-size: 16px !important;
                                    color: #00ff88 !important;
                                    font-weight: bold !important;
                                    font-family: 'Bungee', monospace !important;
                                ">💰 $2 Challenge</div>
                                <div style="
                                    font-size: 12px !important;
                                    color: #ffffff !important;
                                    font-family: 'Bungee', monospace !important;
                                ">Winner gets $3.60</div>
                            </button>
                            
                            <button id="challenge5Btn" style="
                                background: rgba(0, 255, 136, 0.2) !important;
                                border: 2px solid #00ff88 !important;
                                border-radius: 8px !important;
                                padding: 12px !important;
                                text-align: center !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                min-width: 120px !important;
                            "
                            onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                            onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                            class="info-line">
                                <div style="
                                    font-size: 16px !important;
                                    color: #00ff88 !important;
                                    font-weight: bold !important;
                                    font-family: 'Bungee', monospace !important;
                                ">💎 $5 Challenge</div>
                                <div style="
                                    font-size: 12px !important;
                                    color: #ffffff !important;
                                    font-family: 'Bungee', monospace !important;
                                ">Winner gets $9.00</div>
                            </button>
                        </div>
                    </div>
                    
                    <div style="
                        display: flex !important;
                        gap: 10px !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                    ">
                        <button id="shareScoreBtn" style="
                            background: none !important;
                            color: #00ff88 !important;
                            border: 1px solid #00ff88 !important;
                            padding: 10px 16px !important;
                            border-radius: 8px !important;
                            font-size: 12px !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            font-family: 'Bungee', monospace !important;
                        "
                        onmouseover="this.style.backgroundColor='rgba(0, 255, 136, 0.1)'"
                        onmouseout="this.style.backgroundColor='transparent'"
                        class="info-line">
                            Share Score
                        </button>
                    </div>
                </div>
                
                <!-- PRIMARY ACTION BUTTONS -->
                <div style="
                    display: flex !important;
                    gap: 10px !important;
                    justify-content: center !important;
                    margin-bottom: 12px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(0, 212, 255, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(0, 212, 255, 0.4)'"
                    class="info-line">
                        🔄 PLAY AGAIN
                    </button>
                    
                    <button id="gamesBtn" style="
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                        color: #ffffff !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(255, 107, 107, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(255, 107, 107, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(255, 107, 107, 0.4)'"
                    class="info-line">
                        🎮 GAMES
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 2px solid #ffaa00 !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        text-shadow: 0 0 10px #ffaa00 !important;
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.3) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(255, 170, 0, 0.1)'; this.style.boxShadow='0 0 25px rgba(255, 170, 0, 0.5)'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.boxShadow='0 0 15px rgba(255, 170, 0, 0.3)'"
                    class="info-line">
                        🏠 HOME
                    </button>
                </div>
            </div>
        `;
        
        // Create professional horizontal layout
        n.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes chicletEntrance {
                    0% { transform: translateY(-30px) scale(0.3) rotate(10deg); opacity: 0; }
                    60% { transform: translateY(2px) scale(1.1) rotate(-3deg); opacity: 0.8; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes neonGlow { 
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
                }
                
                .game-over-card { animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .chiclet { animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .chiclet:nth-child(1) { animation-delay: 0.1s; }
                .chiclet:nth-child(2) { animation-delay: 0.2s; }
                .chiclet:nth-child(3) { animation-delay: 0.3s; }
                .chiclet:nth-child(4) { animation-delay: 0.4s; }
                .chiclet:nth-child(5) { animation-delay: 0.5s; }
                .chiclet:nth-child(6) { animation-delay: 0.6s; }
                .chiclet:nth-child(7) { animation-delay: 0.7s; }
                .chiclet:nth-child(8) { animation-delay: 0.8s; }
            </style>
            
            <!-- WORLD-CLASS FULL-WIDTH PROFESSIONAL LAYOUT -->
            <div class="game-over-card" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                border: 3px solid #00d4ff !important;
                border-radius: 20px !important;
                padding: 30px !important;
                width: calc(100vw - 40px) !important;
                height: calc(100vh - 80px) !important;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.5) !important;
                position: relative !important;
                overflow: hidden !important;
                margin: auto !important;
                backdrop-filter: blur(15px) !important;
                display: grid !important;
                grid-template-columns: 1fr 2fr 1fr !important;
                grid-template-rows: auto auto auto 1fr auto !important;
                gap: 25px !important;
                align-items: start !important;
            ">
                <!-- TOP ROW: PLAYER NAME & SCORE -->
                <div style="
                    grid-column: 1 / -1 !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    background: rgba(0, 212, 255, 0.08) !important;
                    border: 2px solid rgba(0, 212, 255, 0.4) !important;
                    border-radius: 15px !important;
                    padding: 25px 40px !important;
                    margin-bottom: 15px !important;
                ">
                    <div style="
                        font-size: 28px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                        animation: neonGlow 3s ease-in-out infinite !important;
                    ">👤 <span id="playerNameDisplay">PLAYER</span></div>
                    
                    <div style="
                        font-size: 64px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        text-shadow: 0 0 30px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                        animation: scoreGlow 2s ease-in-out infinite !important;
                    ">${t.toLocaleString()}</div>
                </div>
                
                <!-- NEON DROP TITLE ROW -->
                <div style="
                    grid-column: 1 / -1 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin-bottom: 15px !important;
                ">
                    <div style="display: flex !important; margin-right: 8px !important;">
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                            color: #000000 !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(0, 212, 255, 0.6) !important;
                        ">N</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                            color: #000000 !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(0, 212, 255, 0.6) !important;
                        ">E</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                            color: #000000 !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(0, 212, 255, 0.6) !important;
                        ">O</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                            color: #000000 !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(0, 212, 255, 0.6) !important;
                        ">N</div>
                    </div>
                    <div style="width: 12px !important;"></div>
                    <div style="display: flex !important;">
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                            color: #ffffff !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(255, 107, 107, 0.6) !important;
                        ">D</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                            color: #ffffff !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(255, 107, 107, 0.6) !important;
                        ">R</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                            color: #ffffff !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(255, 107, 107, 0.6) !important;
                        ">O</div>
                        <div class="chiclet" style="
                            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                            color: #ffffff !important;
                            width: 24px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 1px !important;
                            border-radius: 4px !important;
                            font-weight: bold !important;
                            font-size: 16px !important;
                            box-shadow: 0 0 12px rgba(255, 107, 107, 0.6) !important;
                        ">P</div>
                    </div>
                </div>
                
                <!-- TOP 3 LEADERBOARD PLAYERS (SPANS ALL COLUMNS) -->
                <div style="
                    grid-column: 1 / -1 !important;
                    display: flex !important;
                    justify-content: center !important;
                    gap: 30px !important;
                    margin-bottom: 20px !important;
                ">
                    <!-- 2nd Place -->
                    <div style="
                        background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%) !important;
                        border: 2px solid #c0c0c0 !important;
                        border-radius: 15px !important;
                        padding: 20px !important;
                        text-align: center !important;
                        min-width: 180px !important;
                        box-shadow: 0 0 20px rgba(192, 192, 192, 0.3) !important;
                    ">
                        <div style="font-size: 32px !important; margin-bottom: 8px !important;">🥈</div>
                        <div style="color: #000; font-weight: bold; font-size: 16px; font-family: 'Bungee', monospace;">Player2</div>
                        <div style="color: #000; font-size: 20px; font-weight: bold; margin-top: 5px;">1,250</div>
                    </div>
                    
                    <!-- 1st Place (Elevated) -->
                    <div style="
                        background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%) !important;
                        border: 3px solid #ffd700 !important;
                        border-radius: 18px !important;
                        padding: 25px !important;
                        text-align: center !important;
                        min-width: 200px !important;
                        transform: scale(1.1) translateY(-10px) !important;
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.5) !important;
                        animation: leaderboardPulse 3s ease-in-out infinite !important;
                    ">
                        <div style="font-size: 40px !important; margin-bottom: 10px !important;">👑</div>
                        <div style="color: #000; font-weight: bold; font-size: 18px; font-family: 'Bungee', monospace;">Champion</div>
                        <div style="color: #000; font-size: 24px; font-weight: bold; margin-top: 8px;">2,850</div>
                    </div>
                    
                    <!-- 3rd Place -->
                    <div style="
                        background: linear-gradient(135deg, #cd7f32 0%, #b8860b 100%) !important;
                        border: 2px solid #cd7f32 !important;
                        border-radius: 15px !important;
                        padding: 20px !important;
                        text-align: center !important;
                        min-width: 180px !important;
                        box-shadow: 0 0 20px rgba(205, 127, 50, 0.3) !important;
                    ">
                        <div style="font-size: 32px !important; margin-bottom: 8px !important;">🥉</div>
                        <div style="color: #000; font-weight: bold; font-size: 16px; font-family: 'Bungee', monospace;">Player3</div>
                        <div style="color: #000; font-size: 20px; font-weight: bold; margin-top: 5px;">980</div>
                    </div>
                </div>
                
                <!-- LEFT COLUMN: TOURNAMENT INFO -->
                <div style="
                    background: rgba(255, 170, 0, 0.1) !important;
                    border: 2px solid #ffaa00 !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    text-align: center !important;
                    height: fit-content !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #ffaa00 !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⏰ TOURNAMENT</div>
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        margin-bottom: 10px !important;
                    ">Next: 11:15 PM EST</div>
                    <div style="
                        font-size: 12px !important;
                        color: #ffaa00 !important;
                        font-family: 'Bungee', monospace !important;
                    ">Prize Pool: $50</div>
                </div>
                
                <!-- CENTER COLUMN: GAME STATS -->
                <div style="
                    background: rgba(0, 212, 255, 0.05) !important;
                    border: 2px solid rgba(0, 212, 255, 0.3) !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    text-align: center !important;
                    height: fit-content !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #00d4ff !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">📊 GAME STATS</div>
                    <div id="playerInfoSection" style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                    ">Loading...</div>
                </div>
                
                <!-- RIGHT COLUMN: CHALLENGES -->
                <div style="
                    background: rgba(0, 255, 136, 0.1) !important;
                    border: 2px solid #00ff88 !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    text-align: center !important;
                    height: fit-content !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #00ff88 !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⚡ CHALLENGES</div>
                    
                    <button id="challenge2Btn" style="
                        background: rgba(0, 255, 136, 0.2) !important;
                        border: 2px solid #00ff88 !important;
                        border-radius: 10px !important;
                        padding: 12px !important;
                        text-align: center !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        width: 100% !important;
                        margin-bottom: 10px !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.02)'"
                    onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'">
                        <div style="color: #00ff88; font-weight: bold; font-size: 16px;">💰 $2</div>
                        <div style="color: #ffffff; font-size: 12px;">Win $3.60</div>
                    </button>
                    
                    <button id="challenge5Btn" style="
                        background: rgba(0, 255, 136, 0.2) !important;
                        border: 2px solid #00ff88 !important;
                        border-radius: 10px !important;
                        padding: 12px !important;
                        text-align: center !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        width: 100% !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.02)'"
                    onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'">
                        <div style="color: #00ff88; font-weight: bold; font-size: 16px;">💎 $5</div>
                        <div style="color: #ffffff; font-size: 12px;">Win $9.00</div>
                    </button>
                </div>
                
                <!-- BOTTOM ROW: ACTION BUTTONS (SPANS ALL COLUMNS) -->
                <div style="
                    grid-column: 1 / -1 !important;
                    display: flex !important;
                    gap: 15px !important;
                    justify-content: center !important;
                    margin-top: 10px !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4) !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        🔄 PLAY AGAIN
                    </button>
                    
                    <button id="viewLeaderboardBtn" style="
                        background: none !important;
                        color: #00d4ff !important;
                        border: 2px solid #00d4ff !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'">
                        🏆 LEADERBOARD
                    </button>
                    
                    <button id="shareScoreBtn" style="
                        background: none !important;
                        color: #00ff88 !important;
                        border: 2px solid #00ff88 !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 255, 136, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'">
                        📤 SHARE
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 2px solid #ffaa00 !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(255, 170, 0, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'">
                        🏠 HOME
                    </button>
                </div>
            </div>
        `;
        
        try{
            document.body.appendChild(n);
            this.log(this.LOG_LEVEL.INFO,"✅ Professional horizontal overlay created");
            this.setupButtonHandlers(n,t);
        }catch(r){
            this.log(this.LOG_LEVEL.ERROR,"❌ Error creating horizontal overlay:",r);
        }
    }updateOverlayWithPlayerInfo(t,e,o){this.log(this.LOG_LEVEL.INFO,"⚡ INSTANT: Updating overlay with player info");const n=document.getElementById("game-over-wrapper");if(!n){this.log(this.LOG_LEVEL.ERROR,"❌ No game-over-wrapper found for player info update");return}const r=n.querySelector("#playerInfoSection");r&&(r.innerHTML=`
                <div style="
                    font-size: 14px !important;
                    color: #ffffff !important;
                    margin-bottom: 3px !important;
                    font-family: 'Bungee', monospace !important;
                " class="info-line">👤 ${e}</div>
            `,this.log(this.LOG_LEVEL.INFO,"✅ Player info updated in overlay"));const a=this.getLeaderboardForOverlay(t);a?(this.log(this.LOG_LEVEL.INFO,"📊 Updating overlay with cached leaderboard data"),this.updateLeaderboardInOverlay(a)):this.log(this.LOG_LEVEL.INFO,"📊 No cached data available, overlay will show hard-coded medals")}setupButtonHandlers(t,e){this.log(this.LOG_LEVEL.INFO,"🔍 Setting up button handlers for overlay...");const o=t.querySelector("#playAgainBtn");o?(this.log(this.LOG_LEVEL.INFO,"🎮 Setting up Play Again button - will be updated with API data"),o.addEventListener("click",async s=>{if(this.log(this.LOG_LEVEL.INFO,"🎮 Play Again button clicked"),s.stopPropagation(),o.disabled){this.log(this.LOG_LEVEL.INFO,"🎯 Play Again button is disabled - ignoring click");return}this.leaderboardInstance&&this.leaderboardInstance.isVisible&&(this.log(this.LOG_LEVEL.INFO,"🎮 Hiding leaderboard instance"),this.leaderboardInstance.hide()),this.hide(),this.log(this.LOG_LEVEL.INFO,"🎮 Play Again clicked - starting new game"),this.eventBus.emit("startGame")})):this.log(this.LOG_LEVEL.ERROR,"❌ Play Again button not found!");const n=t.querySelector("#homeBtn");n&&n.addEventListener("click",()=>{this.log(this.LOG_LEVEL.INFO,"🏠 Home button clicked"),this.hide(),window.location.href="/"});const r=t.querySelector("#viewLeaderboardBtn");r&&(this.log(this.LOG_LEVEL.INFO,"🏆 Setting up Leaderboard button listener"),r.addEventListener("click",s=>{this.log(this.LOG_LEVEL.INFO,"🏆 Leaderboard button clicked - showing leaderboard"),s.stopPropagation(),this.showStyledLeaderboard()}));const a=t.querySelector("#challenge2Btn");a&&a.addEventListener("click",s=>{this.log(this.LOG_LEVEL.INFO,"💰 $2 Challenge button clicked"),s.stopPropagation(),this.createChallenge(e,2)});const i=t.querySelector("#challenge5Btn");i&&i.addEventListener("click",s=>{this.log(this.LOG_LEVEL.INFO,"💎 $5 Challenge button clicked"),s.stopPropagation(),this.createChallenge(e,5)});const p=t.querySelector("#shareScoreBtn");p&&p.addEventListener("click",s=>{this.log(this.LOG_LEVEL.INFO,"📤 Share Score button clicked"),s.stopPropagation(),this.shareScore(e)});const d=t.querySelector("#gamesBtn");d&&d.addEventListener("click",s=>{this.log(this.LOG_LEVEL.INFO,"🎮 Games button clicked"),s.stopPropagation(),this.hide(),window.location.href="/games/"})}getLeaderboardForOverlay(t){return this.cachedLeaderboardData&&this.cachedLeaderboardData.score===t?(this.log(this.LOG_LEVEL.INFO,"📊 Using cached leaderboard data for overlay"),this.cachedLeaderboardData):this.apiCallInProgress&&this.currentGameScore===t?(this.log(this.LOG_LEVEL.INFO,"⏳ API call in progress, waiting for result..."),null):(this.log(this.LOG_LEVEL.WARN,"❌ No leaderboard data available for overlay"),null)}}export{B as GameOverSystem};