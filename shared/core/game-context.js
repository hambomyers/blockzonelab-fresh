export class GameContext {
  constructor({ eventBus, engine, overlays, audio }) {
    this.eventBus = eventBus;
    this.engine = engine;
    this.overlays = overlays;
    this.audio = audio;
    // ...add more as needed
  }
} 
