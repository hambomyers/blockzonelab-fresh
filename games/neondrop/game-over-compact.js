// COMPACT OVERLAY FIX - Replace the createOverlayWithHardcodedMedals method with this version

createOverlayWithHardcodedMedals(t){
    this.log(this.LOG_LEVEL.INFO,"⚡ COMPACT: Creating overlay that fits viewport height");
    const o=document.getElementById("game-over-wrapper");
    o&&o.remove();
    
    const n=document.createElement("div");
    n.id="game-over-wrapper";
    n.className="game-over-overlay";
    n.style.cssText=`
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
        padding: 10px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    `;
    
    n.innerHTML=`
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes cardSlideIn {
                from { opacity: 0; transform: scale(0.8) translateY(30px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes chicletEntrance {
                0% { transform: translateY(-20px) scale(0.5) rotate(5deg); opacity: 0; }
                60% { transform: translateY(1px) scale(1.05) rotate(-2deg); opacity: 0.9; }
                100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
            }
            
            .game-over-card { animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
            .chiclet { animation: chicletEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            
            .chiclet:nth-child(1) { animation-delay: 0.1s; }
            .chiclet:nth-child(2) { animation-delay: 0.2s; }
            .chiclet:nth-child(3) { animation-delay: 0.3s; }
            .chiclet:nth-child(4) { animation-delay: 0.4s; }
            .chiclet:nth-child(5) { animation-delay: 0.5s; }
            .chiclet:nth-child(6) { animation-delay: 0.6s; }
            .chiclet:nth-child(7) { animation-delay: 0.7s; }
            .chiclet:nth-child(8) { animation-delay: 0.8s; }
        </style>
        
        <!-- COMPACT GAME OVER CARD -->
        <div class="game-over-card" style="
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
            border: 2px solid #00d4ff !important;
            border-radius: 15px !important;
            padding: 15px !important;
            max-width: 420px !important;
            width: 90% !important;
            max-height: calc(100vh - 80px) !important;
            text-align: center !important;
            box-shadow: 0 0 25px rgba(0, 212, 255, 0.3) !important;
            position: relative !important;
            overflow-y: auto !important;
            margin: auto !important;
            backdrop-filter: blur(10px) !important;
        ">
            <!-- Compact Chiclet Header -->
            <div style="margin-bottom: 12px;">
                <div style="
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin-bottom: 6px !important;
                    font-family: 'Bungee', monospace !important;
                ">
                    <div style="display: flex !important; margin-right: 6px !important;">
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
                    <div style="width: 6px !important;"></div>
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
                
                <!-- Compact Score Section -->
                <div style="margin-bottom: 12px;">
                    <div style="
                        font-size: 32px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        margin-bottom: 6px !important;
                        text-shadow: 0 0 15px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                    ">${t.toLocaleString()}</div>
                    <div id="playerInfoSection" style="
                        font-size: 13px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        margin-bottom: 3px !important;
                    ">👤 Loading player...</div>
                </div>
                
                <!-- Compact Buttons -->
                <div style="
                    display: flex !important;
                    gap: 8px !important;
                    justify-content: center !important;
                    margin-bottom: 10px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 8px 16px !important;
                        border-radius: 8px !important;
                        font-size: 12px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 15px rgba(0, 212, 255, 0.4) !important;
                        min-width: 100px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        🔄 PLAY AGAIN
                    </button>
                    
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
                        min-width: 100px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'">
                        🏆 LEADERBOARD
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 1px solid #ffaa00 !important;
                        padding: 8px 16px !important;
                        border-radius: 8px !important;
                        font-size: 12px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        min-width: 100px !important;
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
        this.log(this.LOG_LEVEL.INFO,"✅ Compact overlay created and added to document.body");
        this.setupButtonHandlers(n,t);
    }catch(r){
        this.log(this.LOG_LEVEL.ERROR,"❌ Error creating compact overlay:",r);
    }
}
