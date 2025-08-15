import{PlayerProfile as b}from"./PlayerProfile.js";class g{constructor(){this.apiUrl="https://api.blockzonelab.com/api/leaderboard",this.isVisible=!1,this.cssInjected=!1,this.playerProfile=window.globalPlayerProfile||new b,window.globalPlayerProfile||(window.globalPlayerProfile=this.playerProfile)}injectCSS(){if(this.cssInjected)return;const e=document.createElement("style");e.id="leaderboard-styles",e.textContent=`
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
        `,document.head.appendChild(e),this.cssInjected=!0}async show(){if(!this.isVisible)try{const e=await this.fetchLeaderboard();this.createOverlay(e),this.isVisible=!0}catch{this.showError("Failed to load leaderboard data")}}hide(){const e=document.getElementById("leaderboard-overlay");e&&(e.remove(),this.isVisible=!1)}async fetchLeaderboard(){try{return await this.playerProfile.getLeaderboardData()}catch(e){throw e}}createOverlay(e){this.injectCSS();const t=document.createElement("div");t.id="leaderboard-overlay",t.className="leaderboard-overlay";const a=document.createDocumentFragment(),n=document.createElement("div");n.className="leaderboard-container";const r=this.createTitleSection();n.appendChild(r);const i=this.createTournamentInfo(e);n.appendChild(i);const d=this.createLeaderboardTable(e);n.appendChild(d);const o=this.createStats(e);n.appendChild(o);const l=this.createActionButtons();n.appendChild(l),a.appendChild(n),t.appendChild(a),document.body.appendChild(t),this.addEventListeners()}createTitleSection(){const e=document.createElement("div");e.className="title-section";const t=document.createElement("div");t.className="netflix-chiclet-title";const a=document.createElement("div");a.className="chiclet-word",["N","E","O","N"].forEach(d=>{const o=document.createElement("div");o.className="chiclet neon",o.textContent=d,a.appendChild(o)});const n=document.createElement("div");n.className="chiclet-spacer";const r=document.createElement("div");r.className="chiclet-word",["D","R","O","P"].forEach(d=>{const o=document.createElement("div");o.className="chiclet drop",o.textContent=d,r.appendChild(o)}),t.appendChild(a),t.appendChild(n),t.appendChild(r);const i=document.createElement("div");return i.className="leaderboard-title neon-title",i.textContent="LEADERBOARD",e.appendChild(t),e.appendChild(i),e}createTournamentInfo(e){const t=document.createElement("div");t.className="tournament-info info-line";const a=this.formatTournamentPhase(e);a&&t.appendChild(a);const n=document.createElement("div");n.className="tournament-period",n.textContent=e.period==="daily-tournament"?"Daily Tournament":e.period;const r=document.createElement("div");r.className="tournament-day",r.textContent=`Day: ${e.tournament_day||"Today"}`;const i=document.createElement("div");return i.className="tournament-reset",i.textContent=`Next Tournament: ${this.formatResetTime(e.next_reset,e.next_tournament_date)}`,t.appendChild(n),t.appendChild(r),t.appendChild(i),t}createLeaderboardTable(e){const t=document.createElement("div");t.className="leaderboard-table";const a=document.createElement("div");a.className="table-header";const n=document.createElement("div");n.className="header-rank",n.textContent="RANK";const r=document.createElement("div");r.className="header-player",r.textContent="PLAYER";const i=document.createElement("div");i.className="header-score",i.textContent="SCORE";const d=document.createElement("div");d.className="header-time",d.textContent="TIME",a.appendChild(n),a.appendChild(r),a.appendChild(i),a.appendChild(d);const o=document.createElement("div");o.className="table-body";const l=document.createDocumentFragment();return e.scores.forEach((s,c)=>{const p=this.createLeaderboardRow(s,c);l.appendChild(p)}),o.appendChild(l),t.appendChild(a),t.appendChild(o),t}createStats(e){const t=document.createElement("div");t.className="leaderboard-stats info-line";const a=document.createElement("div");a.className="total-players",a.textContent=`Total Players: ${e.total_players}`;const n=document.createElement("div");return n.className="last-updated",n.textContent=`Updated: ${new Date(e.updated_at).toLocaleTimeString()}`,t.appendChild(a),t.appendChild(n),t}createActionButtons(){const e=document.createElement("div");e.className="leaderboard-actions";const t=document.createElement("button");t.id="refreshLeaderboardBtn",t.className="action-btn primary",t.textContent="🔄 Refresh";const a=document.createElement("button");return a.id="closeLeaderboardBtn",a.className="action-btn secondary",a.textContent="✕ Close",e.appendChild(t),e.appendChild(a),e}addEventListeners(){document.getElementById("refreshLeaderboardBtn").addEventListener("click",()=>{this.hide(),setTimeout(()=>this.show(),100)}),document.getElementById("closeLeaderboardBtn").addEventListener("click",()=>{this.hide()}),document.getElementById("leaderboard-overlay").addEventListener("click",e=>{e.target.id==="leaderboard-overlay"&&this.hide()})}createLeaderboardRow(e,t){const a=t<3?`rank-${t+1}`:"",n=t===0?"🥇":t===1?"🥈":t===2?"🥉":"",r=e.display_name||e.player_name||"Unknown Player",i=e.rank||t+1,d=this.formatScoreTime(e.timestamp);let o=e.player_id;typeof o=="object"&&(o=JSON.stringify(o));const l=document.createElement("div");l.className=`leaderboard-row ${a}`;const s=document.createElement("div");s.className="rank-cell",s.innerHTML=`${n} ${i}`,l.appendChild(s);const c=document.createElement("div");c.className="player-cell";const p=document.createElement("div");p.className="player-name",p.textContent=r,c.appendChild(p);const m=document.createElement("div");m.className="player-id",m.textContent=o,c.appendChild(m),l.appendChild(c);const h=document.createElement("div");h.className="score-cell",h.textContent=e.score.toLocaleString(),l.appendChild(h);const x=document.createElement("div");return x.className="time-cell",x.textContent=d,l.appendChild(x),l}formatResetTime(e,t){if(t)return`11:15 PM EST on ${t}`;const a=new Date,n=a.toLocaleDateString("en-US",{month:"long"}),r=a.getDate(),i=a.getFullYear(),d=this.getOrdinalSuffix(r);return`11:15 PM EST on ${n} ${r}${d} ${i}`}getOrdinalSuffix(e){if(e>3&&e<21)return"th";switch(e%10){case 1:return"st";case 2:return"nd";case 3:return"rd";default:return"th"}}formatScoreTime(e){if(!e)return"--:--";try{const t=new Date(e);return isNaN(t.getTime())?"--:--":t.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"America/New_York"})}catch{return"--:--"}}formatTournamentPhase(e){if(!e.tournament_phase)return null;switch(e.tournament_phase){case"celebration":const t=document.createElement("div");t.className="celebration-banner";const a=document.createElement("div");a.className="celebration-icon",a.textContent="🏆";const n=document.createElement("div");n.className="celebration-text";const r=document.createElement("div");r.className="celebration-title",r.textContent="Tournament Complete!";const i=document.createElement("div");return i.className="celebration-subtitle",i.textContent="Prizes being distributed • Next tournament starts at 11:15 PM EST",n.appendChild(r),n.appendChild(i),t.appendChild(a),t.appendChild(n),t;case"active":const d=document.createElement("div");d.className="tournament-status";const o=document.createElement("div");o.className="status-icon",o.textContent="⚡";const l=document.createElement("div");return l.className="status-text",l.textContent="Tournament Active • Ends at 11:00 PM EST",d.appendChild(o),d.appendChild(l),d;default:return null}}showError(e){const t=document.createElement("div");t.id="leaderboard-error",t.className="leaderboard-overlay",t.innerHTML=`
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Leaderboard Error</div>
                <div class="error-message">${e}</div>
                <button id="closeErrorBtn" class="action-btn secondary">Close</button>
            </div>
        `,document.body.appendChild(t),document.getElementById("closeErrorBtn").addEventListener("click",()=>{t.remove()})}}export{g as LeaderboardDisplay};
