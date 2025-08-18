export class OverlayManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.overlays = {};
    this.current = null;
    this.overlayContainer = null;
    
    // Initialize the overlay container
    this.initOverlayContainer();
  }

  /**
   * Initialize the main overlay container
   */
  initOverlayContainer() {
    // Remove existing container if present
    const existing = document.getElementById('overlay-manager-container');
    if (existing) {
      existing.remove();
    }

    // Create main overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'overlay-manager-container';
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 40px 20px;
      box-sizing: border-box;
      font-family: 'Bungee', monospace;
      animation: fadeIn 0.8s ease-out;
    `;

    // Add global styles for overlays
    this.addGlobalStyles();
    
    document.body.appendChild(this.overlayContainer);
  }

  /**
   * Add global styles for all overlays
   */
  addGlobalStyles() {
    const styleId = 'overlay-manager-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeIn { 
        from { opacity: 0; } 
        to { opacity: 1; } 
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
      
      @keyframes neonGlow { 
        0%, 100% { 
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; 
        }
        50% { 
          text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; 
        }
      }
      
      @keyframes chicletEntrance {
        0% { 
          transform: translateY(-30px) scale(0.3) rotate(10deg); 
          opacity: 0; 
        }
        60% { 
          transform: translateY(2px) scale(1.1) rotate(-3deg); 
          opacity: 0.8; 
        }
        100% { 
          transform: translateY(0) scale(1) rotate(0deg); 
          opacity: 1; 
        }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .overlay-frame {
        background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border: 2px solid #00d4ff;
        border-radius: 24px;
        padding: 24px;
        max-width: 640px;
        width: 90%;
        text-align: center;
        box-shadow: 
          0 0 64px rgba(0, 212, 255, 0.4),
          0 20px 64px rgba(0, 0, 0, 0.6);
        position: relative;
        overflow: hidden;
        animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .overlay-frame::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00d4ff, transparent);
        animation: shimmer 2s infinite;
      }
      
      .overlay-header {
        margin-bottom: 24px;
        position: relative;
        text-align: center;
      }
      
      .neon-drop-title {
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
        width: 19px;
        height: 19px;
      }
      
      .chiclet {
        width: 19px;
        height: 19px;
        display: flex;
        align-items: center;
        justify-content: center;
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
      
      .chiclet:nth-child(1) { animation-delay: 0.1s; }
      .chiclet:nth-child(2) { animation-delay: 0.2s; }
      .chiclet:nth-child(3) { animation-delay: 0.3s; }
      .chiclet:nth-child(4) { animation-delay: 0.4s; }
      .chiclet:nth-child(5) { animation-delay: 0.5s; }
      .chiclet:nth-child(6) { animation-delay: 0.6s; }
      .chiclet:nth-child(7) { animation-delay: 0.7s; }
      .chiclet:nth-child(8) { animation-delay: 0.8s; }
      
      .overlay-title {
        font-size: 29px;
        font-weight: bold;
        color: #00d4ff;
        text-shadow: 0 0 12px #00d4ff, 0 0 20px #00d4ff;
        margin-top: 16px;
        animation: neonGlow 2s ease-in-out infinite;
      }
      
      .overlay-subtitle {
        color: #a0a0a0;
        font-size: 16px;
        margin-top: 10px;
        font-weight: 300;
      }
      
      .overlay-content {
        margin: 24px 0;
      }
      
      .overlay-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      
      .overlay-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #cccccc;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 8px 13px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        min-width: 64px;
        text-align: center;
        font-family: 'Bungee', monospace;
      }
      
      .overlay-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }
      
      .overlay-btn.primary {
        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
        color: #000000;
        border-color: #00d4ff;
        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
      }
      
      .overlay-btn.primary:hover {
        background: linear-gradient(135deg, #00b8e6 0%, #0088b3 100%);
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
      }
      
      .overlay-btn.secondary {
        background: rgba(255, 107, 107, 0.2);
        color: #ff6b6b;
        border-color: #ff6b6b;
      }
      
      .overlay-btn.secondary:hover {
        background: rgba(255, 107, 107, 0.3);
        color: #ffffff;
        border-color: #ff6b6b;
      }
      
      .overlay-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: #00d4ff;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .overlay-close:hover {
        background: rgba(0, 212, 255, 0.1);
        transform: scale(1.1);
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .overlay-frame {
          padding: 20px 15px;
          border-radius: 20px;
          width: 95%;
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
        
        .overlay-title {
          font-size: 28px;
        }
      }
      
      @media (max-width: 480px) {
        .overlay-frame {
          padding: 15px 10px;
          border-radius: 15px;
          width: 98%;
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
        
        .overlay-title {
          font-size: 24px;
        }
        
        .overlay-actions {
          gap: 8px;
        }
        
        .overlay-btn {
          padding: 6px 10px;
          font-size: 9px;
          min-width: 56px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Register an overlay with the manager
   */
  registerOverlay(name, overlayInstance) {
    this.overlays[name] = overlayInstance;
  }

  /**
   * Show an overlay with consistent styling
   */
  async show(name, data = {}) {
    if (this.current && this.current.hide) {
      await this.current.hide();
    }
    
    const overlay = this.overlays[name];
    if (overlay && overlay.show) {
      await overlay.show(data);
      this.current = overlay;
    } else {
      console.error('❌ Overlay not found or missing show method:', { name, overlay });
    }
  }

  /**
   * Show a custom overlay with the standard frame and neon drop styling
   */
  showCustomOverlay(config) {
    const {
      title = 'OVERLAY',
      subtitle = '',
      content = '',
      actions = [],
      onClose = null,
      showNeonDrop = true,
      customClass = ''
    } = config;

    // Show the overlay container
    this.overlayContainer.style.display = 'flex';
    
    // Create the overlay content
    const overlayHTML = `
      <div class="overlay-frame ${customClass}">
        <button class="overlay-close" onclick="window.overlayManager.hideCurrent()">×</button>
        
        <div class="overlay-header">
          ${showNeonDrop ? `
            <div class="neon-drop-title">
              <div class="chiclet-word">
                <div class="chiclet neon">N</div>
                <div class="chiclet neon">E</div>
                <div class="chiclet neon">O</div>
                <div class="chiclet neon">N</div>
              </div>
              <div class="chiclet-spacer"></div>
              <div class="chiclet-word">
                <div class="chiclet drop">D</div>
                <div class="chiclet drop">R</div>
                <div class="chiclet drop">O</div>
                <div class="chiclet drop">P</div>
              </div>
            </div>
          ` : ''}
          
          <div class="overlay-title">${title}</div>
          ${subtitle ? `<div class="overlay-subtitle">${subtitle}</div>` : ''}
        </div>
        
        <div class="overlay-content">
          ${content}
        </div>
        
        ${actions.length > 0 ? `
          <div class="overlay-actions">
            ${actions.map(action => `
              <button class="overlay-btn ${action.class || ''}" onclick="${action.onClick}">
                ${action.text}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    this.overlayContainer.innerHTML = overlayHTML;
    
    // Store close handler
    if (onClose) {
      this.currentCloseHandler = onClose;
    }
  }

  /**
   * Show a game over overlay with consistent styling
   */
  showGameOver(data) {
    const { score, playerName, leaderboardData, onPlayAgain, onViewLeaderboard } = data;
    
    const content = `
      <div style="margin-bottom: 20px;">
        <div style="
          font-size: 36px;
          font-weight: bold;
          color: #00d4ff;
          margin-bottom: 10px;
          text-shadow: 0 0 15px #00d4ff;
          font-family: 'Bungee', monospace;
        ">${score ? score.toLocaleString() : '0'}</div>
        
        ${playerName ? `
          <div style="
            font-size: 14px;
            color: #ffffff;
            margin-bottom: 5px;
            font-family: 'Bungee', monospace;
          ">👤 ${playerName}</div>
        ` : ''}
        
        <div style="
          font-size: 12px;
          color: #00ff88;
          font-family: 'Bungee', monospace;
        ">⏰ Next Tournament: 11:15 PM EST</div>
      </div>
      
      ${leaderboardData ? `
        <div style="
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid #00d4ff;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 15px;
        ">
          <div style="
            font-size: 18px;
            color: #00d4ff;
            margin-bottom: 15px;
            font-weight: bold;
            text-align: center;
          ">🏆 LEADERBOARD</div>
          
          <div style="font-size: 14px; color: #ffffff; text-align: center;">
            ${leaderboardData.map((entry, index) => `
              <div style="
                color: #ffffff;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                padding: 4px;
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
              ">
                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} 
                ${entry.name || 'No Data'} - ${entry.score || 'No Data'} pts
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    const actions = [
      {
        text: '🔄 PLAY AGAIN',
        class: 'primary',
        onClick: onPlayAgain ? onPlayAgain : 'window.overlayManager.hideCurrent()'
      },
      {
        text: '🎮 GAMES',
        class: 'secondary',
        onClick: 'window.location.href="/games/"'
      },
      {
        text: '🏠 HOME',
        class: 'secondary',
        onClick: 'window.location.href="/"'
      }
    ];
    
    if (onViewLeaderboard) {
      actions.unshift({
        text: '📊 VIEW LEADERBOARD',
        class: 'secondary',
        onClick: onViewLeaderboard
      });
    }
    
    this.showCustomOverlay({
      title: 'GAME RESULTS',
      subtitle: 'Tournament Challenge',
      content: content,
      actions: actions,
      showNeonDrop: true
    });
  }

  /**
   * Show a leaderboard overlay
   */
  showLeaderboard(data) {
    const { scores, playerRank, onClose } = data;
    
    const content = `
      <div style="
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid #00d4ff;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 15px;
      ">
        <div style="
          font-size: 18px;
          color: #00d4ff;
          margin-bottom: 15px;
          font-weight: bold;
          text-align: center;
        ">🏆 DAILY LEADERBOARD</div>
        
        <div style="font-size: 14px; color: #ffffff; text-align: center;">
          ${scores && scores.length > 0 ? scores.map((entry, index) => `
            <div style="
              color: #ffffff;
              margin-bottom: 8px;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              padding: 8px;
              background: rgba(0,0,0,0.3);
              border-radius: 8px;
              ${entry.isCurrentPlayer ? 'border: 1px solid #00ff00; background: rgba(0,255,0,0.1);' : ''}
            ">
              ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} 
              ${entry.name || 'Anonymous'} - ${entry.score || '0'} pts
            </div>
          `).join('') : `
            <div style="color: #888; font-style: italic;">No scores available yet</div>
          `}
        </div>
        
        ${playerRank ? `
          <div style="
            margin-top: 15px;
            padding: 10px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            color: #00ff88;
            font-size: 14px;
            font-weight: bold;
          ">
            🎯 Your Rank: ${playerRank}
          </div>
        ` : ''}
      </div>
    `;
    
    const actions = [
      {
        text: 'CLOSE',
        class: 'secondary',
        onClick: onClose ? onClose : 'window.overlayManager.hideCurrent()'
      }
    ];
    
    this.showCustomOverlay({
      title: 'LEADERBOARD',
      subtitle: 'Daily Tournament Rankings',
      content: content,
      actions: actions,
      showNeonDrop: true
    });
  }

  /**
   * Show a settings overlay
   */
  showSettings(data) {
    const { onSave, onReset } = data;
    
    const content = `
      <div style="text-align: left; color: #ffffff;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #00d4ff;">Sound Effects</label>
          <input type="checkbox" id="sound-effects" checked style="margin-right: 8px;">
          <span>Enable sound effects</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #00d4ff;">Music</label>
          <input type="checkbox" id="music" checked style="margin-right: 8px;">
          <span>Enable background music</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #00d4ff;">Particle Effects</label>
          <input type="checkbox" id="particles" checked style="margin-right: 8px;">
          <span>Show particle effects</span>
        </div>
      </div>
    `;
    
    const actions = [
      {
        text: 'SAVE',
        class: 'primary',
        onClick: onSave ? onSave : 'window.overlayManager.hideCurrent()'
      },
      {
        text: 'RESET',
        class: 'secondary',
        onClick: onReset ? onReset : 'document.getElementById("sound-effects").checked = true; document.getElementById("music").checked = true; document.getElementById("particles").checked = true;'
      },
      {
        text: 'CANCEL',
        class: 'secondary',
        onClick: 'window.overlayManager.hideCurrent()'
      }
    ];
    
    this.showCustomOverlay({
      title: 'SETTINGS',
      subtitle: 'Game Preferences',
      content: content,
      actions: actions,
      showNeonDrop: true
    });
  }

  /**
   * Hide the current overlay
   */
  hideCurrent() {
    if (this.current && this.current.hide) {
      this.current.hide();
    }
    
    // Hide the overlay container
    if (this.overlayContainer) {
      this.overlayContainer.style.display = 'none';
      this.overlayContainer.innerHTML = '';
    }
    
    // Call close handler if exists
    if (this.currentCloseHandler) {
      this.currentCloseHandler();
      this.currentCloseHandler = null;
    }
    
    this.current = null;
  }

  /**
   * Hide all overlays
   */
  hideAll() {
    this.hideCurrent();
    
    // Hide the overlay container
    if (this.overlayContainer) {
      this.overlayContainer.style.display = 'none';
      this.overlayContainer.innerHTML = '';
    }
  }

  /**
   * Check if any overlay is currently visible
   */
  isVisible() {
    return this.overlayContainer && this.overlayContainer.style.display === 'flex';
  }
}
