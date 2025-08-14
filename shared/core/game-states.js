export const GameState = { 
  PLAYING: 'playing', 
  GAME_OVER: 'game_over', 
  LEADERBOARD: 'leaderboard',
  MENU: 'menu'
};

// Minimal state machine for game state transitions
export class GameStateMachine {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = GameState.MENU;
  }

  getState() {
    return this.state;
  }

  transitionToGameState(newState) {
    if (this.state !== newState) {
      const prevState = this.state;
      this.state = newState;
      if (this.eventBus && typeof this.eventBus.emit === 'function') {
        this.eventBus.emit('gameStateChanged', { from: prevState, to: newState });
      }
    }
  }
}
