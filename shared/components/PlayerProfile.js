const o=300*1e3;class d{constructor(){this.profile=null,this.playerStatus=null,this.leaderboardData=null,this.paymentHistory=null,this.loading=!1,this.error=null,this.apiBase="https://api.blockzonelab.com",this.initialized=!1,this.initPromise=null,this.eventListeners={statusChanged:[],paymentUpdated:[],leaderboardUpdated:[],statsUpdated:[],profileUpdated:[]},this.cache={profile:{data:null,timestamp:0,ttl:3e5},status:{data:null,timestamp:0,ttl:6e4},leaderboard:{data:null,timestamp:0,ttl:12e4},payments:{data:null,timestamp:0,ttl:3e5}},this.refreshIntervals={status:null,leaderboard:null}}async ensureInitialized(){if(!this.initialized)return this.initPromise?this.initPromise:(this.initPromise=this._initialize(),this.initPromise)}async _initialize(){try{await this.checkForExistingPlayerAndGreet(),this.initialized=!0}catch{this.initialized=!0}}async checkForExistingPlayerAndGreet(){try{const e=localStorage.getItem("blockzone_player");if(e){const s=JSON.parse(e),n=(s.displayName||s.username||"Player").split("#")[0];this.fetchBackendGreeting(s.id||s.playerId);return}const a=localStorage.getItem("quantum_wallet"),t=localStorage.getItem("quantum_username"),i=localStorage.getItem("quantum_display_name");if(a&&(t||i)){const s=i||t,r=s.split("_")[0]||s.split("#")[0];this.fetchBackendGreeting(a);return}typeof window<"u"&&window.identityManager&&setTimeout(()=>{const s=window.identityManager.getPlayerName?.(),r=window.identityManager.getPlayerId?.();if(s&&!s.startsWith("Player#")){const n=s.split("#")[0];r&&this.fetchBackendGreeting(r)}},100)}catch{}}async fetchBackendGreeting(e){try{const a=await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(e)}`,{method:"GET",headers:{"Content-Type":"application/json",Accept:"application/json"}});if(a.ok){const t=await a.json();if(t.player&&t.player.displayName){const i=t.player.displayName,s=i.split("#")[0],r=JSON.parse(localStorage.getItem("blockzone_player")||"{}");r.displayName=i,r.username=s,localStorage.setItem("blockzone_player",JSON.stringify(r)),this.emit("profileUpdated",{displayName:i,source:"backend"})}}}catch{}}async getPlayerStatus(e=null,a=!1){await this.ensureInitialized();const t="status";if(!a&&this.isCacheValid(t))return this.cache[t].data;e||(window.identityManager&&window.identityManager.getPlayerId?e=window.identityManager.getPlayerId():this.identityManager&&this.identityManager.getPlayerId&&(e=this.identityManager.getPlayerId())),e||(e=this.getCurrentPlayerId());try{const i=await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(e)}`);if(!i.ok)throw new Error(`Status fetch failed: ${i.status}`);const s=await i.json();return this.updateCache(t,s),this.playerStatus=s,this.emit("statusChanged",s),s}catch(i){throw i}}async getLeaderboardData(e=!1){await this.ensureInitialized();const a="leaderboard";if(!e&&this.isCacheValid(a))return this.cache[a].data;try{const t=await fetch(`${this.apiBase}/api/leaderboard`);if(!t.ok)throw new Error(`Leaderboard fetch failed: ${t.status}`);const i=await t.json();return this.updateCache(a,i),this.leaderboardData=i,this.emit("leaderboardUpdated",i),i.scores&&i.scores.length>0,i}catch(t){throw t}}async updatePaymentRecord(e,a,t,i){try{const s=await fetch(`${this.apiBase}/api/players/payment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({player_id:e,payment_type:a,amount:t,transaction_id:i,timestamp:Date.now()})});if(!s.ok)throw new Error(`Payment update failed: ${s.status}`);const r=await s.json();return this.invalidateCache(["status","profile","payments"]),this.emit("paymentUpdated",{paymentType:a,amount:t,transactionId:i,result:r}),r}catch(s){throw s}}async grantUnlimitedPass(e){try{const a=await fetch(`${this.apiBase}/api/game/player/unlimited-pass`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({player_id:e,pass_type:"day_pass",expires_at:new Date(Date.now()+864e5).toISOString()})});if(!a.ok)throw new Error(`Unlimited pass grant failed: ${a.status}`);const t=await a.json();return this.invalidateCache(["status","profile"]),this.emit("statusChanged",{unlimited_pass_granted:!0}),t}catch{return null}}async getComprehensivePlayerData(e,a=!1){try{const[t,i,s]=await Promise.allSettled([this.loadProfile(e),this.getPlayerStatus(e,a),this.getLeaderboardData(a)]);return{profile:t.status==="fulfilled"?this.profile:null,status:i.status==="fulfilled"?i.value:null,leaderboard:s.status==="fulfilled"?s.value:null,timestamp:Date.now()}}catch(t){throw t}}async refreshAllData(e){return this.invalidateCache(["profile","status","leaderboard","payments"]),await this.getComprehensivePlayerData(e,!0)}on(e,a){this.eventListeners[e]||(this.eventListeners[e]=[]),this.eventListeners[e].push(a)}off(e,a){if(!this.eventListeners[e])return;const t=this.eventListeners[e].indexOf(a);t>-1&&this.eventListeners[e].splice(t,1)}emit(e,a){this.eventListeners[e]&&this.eventListeners[e].forEach(t=>{try{t(a)}catch{}})}isCacheValid(e){const a=this.cache[e];return!a||!a.data?!1:Date.now()-a.timestamp<a.ttl}updateCache(e,a){this.cache[e]={data:a,timestamp:Date.now(),ttl:this.cache[e].ttl}}invalidateCache(e){e.forEach(a=>{this.cache[a]&&(this.cache[a].data=null,this.cache[a].timestamp=0)})}clearCache(){Object.keys(this.cache).forEach(e=>{this.cache[e].data=null,this.cache[e].timestamp=0})}startAutoRefresh(e){this.refreshIntervals.status=setInterval(async()=>{try{await this.getPlayerStatus(e,!0)}catch{}},6e4),this.refreshIntervals.leaderboard=setInterval(async()=>{try{await this.getLeaderboardData(!0)}catch{}},12e4)}stopAutoRefresh(){Object.values(this.refreshIntervals).forEach(e=>{e&&clearInterval(e)}),this.refreshIntervals={status:null,leaderboard:null}}getCurrentPlayerId(){return window.identityManager&&window.identityManager.getPlayerId?window.identityManager.getPlayerId():null}async initialize(e){try{return await this.getComprehensivePlayerData(e),this.startAutoRefresh(e),!0}catch(a){throw a}}cleanup(){this.stopAutoRefresh(),this.clearCache(),this.eventListeners={statusChanged:[],paymentUpdated:[],leaderboardUpdated:[],statsUpdated:[],profileUpdated:[]}}async loadProfile(e){this.loading=!0,this.error=null;try{const a=await fetch(`${this.apiBase}/api/players/profile?player_id=${encodeURIComponent(e)}`);if(a.ok){const t=await a.json();if(t.success)this.profile=t.profile;else throw new Error(t.error||"Failed to load profile")}else if(a.status===404)await this.createBasicProfile(e);else{const t=await a.text();throw new Error(`Failed to load profile (${a.status})`)}}catch(a){this.error=a.message}finally{this.loading=!1}}async createBasicProfile(e){try{const a=await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(e)}`);if(a.ok){const t=await a.json();this.profile={player_id:e,display_name:e,username:e,email:null,wallet_address:null,account_type:"wallet_first",verification_status:"unverified",tier:"anonymous",account_status:"active",created_at:new Date().toISOString(),last_activity:new Date().toISOString(),status:{has_unlimited_pass:t.has_unlimited_pass||!1,has_used_free_game:t.has_used_free_game||!1,can_play_free:t.can_play_free!==void 0?t.can_play_free:!1,requires_payment:t.requires_payment||!1,next_reset:t.next_reset,current_day:t.current_day},gaming:{lifetime_high_score:0,total_games_played:0,average_score:0,current_streak:0,tournament_wins:0,total_prizes_won:0},rankings:{current_tournament:"N/A",all_time:"N/A",weekly:"N/A"},payments:{total_spent:0,day_passes_purchased:0,individual_games_purchased:0},education:{courses_completed:0,lessons_completed:0,certificates_earned:0,progress_percentage:0}}}else throw new Error("Unable to get player status")}catch{throw new Error("Unable to create profile. Please try again later.")}}show(){if(this.loading){this.showLoading();return}if(this.error){this.showError();return}this.createProfileOverlay()}showLoading(){const e=document.createElement("div");e.className="profile-overlay",e.innerHTML=`
            <div class="profile-modal">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        `,document.body.appendChild(e)}showError(){const e=document.createElement("div");e.className="profile-overlay",e.innerHTML=`
            <div class="profile-modal">
                <div class="error-message">
                    <h3>❌ Profile Error</h3>
                    <p>${this.error}</p>
                    <button onclick="this.closest('.profile-overlay').remove()">Close</button>
                </div>
            </div>
        `,document.body.appendChild(e)}createProfileOverlay(){const e=document.createElement("div");e.className="profile-overlay",e.innerHTML=this.generateProfileHTML(),document.body.appendChild(e),e.querySelector(".close-btn").addEventListener("click",()=>{e.remove()}),e.addEventListener("click",a=>{a.target===e&&e.remove()})}generateProfileHTML(){const e=this.profile;return`
            <div class="profile-modal">
                <div class="profile-header">
                    <h2>${e.display_name}'s Profile</h2>
                    <button class="close-btn">✕</button>
                </div>
                
                <div class="profile-content">
                    <!-- Identity Section -->
                    <div class="profile-section">
                        <h3>👤 Identity</h3>
                        <div class="identity-grid">
                            <!-- Primary Identity Info -->
                            <div class="identity-item primary-identity">
                                <label>🎮 Username:</label>
                                <span class="username-display">${e.username||e.display_name||e.player_id}</span>
                            </div>
                            <div class="identity-item primary-identity">
                                <label>💼 Wallet Address:</label>
                                <span class="mono wallet-display">${e.wallet_address||"Not Connected"}</span>
                                ${e.wallet_address?'<span class="wallet-status connected">✅ Connected</span>':'<span class="wallet-status disconnected">❌ Not Connected</span>'}
                            </div>
                            
                            <!-- Secondary Identity Info -->
                            <div class="identity-item">
                                <label>🆔 Player ID:</label>
                                <span class="mono">${e.player_id}</span>
                            </div>
                            ${e.email?`
                                <div class="identity-item">
                                    <label>📧 Email:</label>
                                    <span>${e.email}</span>
                                </div>
                            `:""}
                            <div class="identity-item">
                                <label>📅 Member Since:</label>
                                <span>${e.created_at?new Date(e.created_at).toLocaleDateString():"Unknown"}</span>
                            </div>
                            <div class="identity-item">
                                <label>🏆 Account Tier:</label>
                                <span class="tier-badge tier-${e.tier}">${e.tier}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Current Status -->
                    <div class="profile-section">
                        <h3>🎮 Current Status</h3>
                        <div class="status-grid">
                            <div class="status-item ${e.status.has_unlimited_pass?"active":""}">
                                <span class="status-icon">${e.status.has_unlimited_pass?"✅":"❌"}</span>
                                <span>Unlimited Pass</span>
                            </div>
                            <div class="status-item ${e.status.can_play_free?"active":""}">
                                <span class="status-icon">${e.status.can_play_free?"✅":"❌"}</span>
                                <span>Free Game Available</span>
                            </div>
                            <div class="status-item">
                                <span class="status-icon">🕐</span>
                                <span>Next Reset: ${new Date(e.status.next_reset).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Gaming Stats -->
                    <div class="profile-section">
                        <h3>🏆 Gaming Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${(e.gaming.lifetime_high_score||0).toLocaleString()}</div>
                                <div class="stat-label">Lifetime High Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${e.gaming.total_games_played||0}</div>
                                <div class="stat-label">Games Played</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${(e.gaming.average_score||0).toLocaleString()}</div>
                                <div class="stat-label">Average Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${e.gaming.current_streak||0}</div>
                                <div class="stat-label">Current Streak</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${e.gaming.tournament_wins||0}</div>
                                <div class="stat-label">Tournament Wins</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">$${(e.gaming.total_prizes_won||0).toFixed(2)}</div>
                                <div class="stat-label">Total Prizes Won</div>
                            </div>
                        </div>
                    </div>

                    <!-- Rankings -->
                    <div class="profile-section">
                        <h3>📊 Rankings</h3>
                        <div class="rankings-grid">
                            <div class="ranking-item">
                                <span class="ranking-label">Current Tournament:</span>
                                <span class="ranking-value">${e.rankings.current_tournament||"N/A"}</span>
                            </div>
                            <div class="ranking-item">
                                <span class="ranking-label">All-Time:</span>
                                <span class="ranking-value">${e.rankings.all_time||"N/A"}</span>
                            </div>
                            <div class="ranking-item">
                                <span class="ranking-label">This Week:</span>
                                <span class="ranking-value">${e.rankings.weekly||"N/A"}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment History -->
                    <div class="profile-section">
                        <h3>💰 Payment History</h3>
                        <div class="payment-grid">
                            <div class="payment-item">
                                <span class="payment-label">Total Spent:</span>
                                <span class="payment-value">$${(e.payments.total_spent||0).toFixed(2)}</span>
                            </div>
                            <div class="payment-item">
                                <span class="payment-label">Day Passes:</span>
                                <span class="payment-value">${e.payments.day_passes_purchased||0}</span>
                            </div>
                            <div class="payment-item">
                                <span class="payment-label">Individual Games:</span>
                                <span class="payment-value">${e.payments.individual_games_purchased||0}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Education Progress -->
                    <div class="profile-section">
                        <h3>📚 Education Progress</h3>
                        <div class="education-grid">
                            <div class="education-item">
                                <span class="education-label">Courses Completed:</span>
                                <span class="education-value">${e.education.courses_completed||0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Lessons Completed:</span>
                                <span class="education-value">${e.education.lessons_completed||0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Certificates:</span>
                                <span class="education-value">${e.education.certificates_earned||0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Progress:</span>
                                <span class="education-value">${e.education.progress_percentage||0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `}}export{d as PlayerProfile};
