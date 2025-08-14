export class OverlayManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.overlays = {};
    this.current = null;
  }

  registerOverlay(name, overlayInstance) {
    this.overlays[name] = overlayInstance;
  }

  async show(name, data) {
    
    
    
    
    if (this.current && this.current.hide) {
      
      await this.current.hide();
    }
    
    const overlay = this.overlays[name];
    if (overlay && overlay.show) {
      
      await overlay.show(data);
      this.current = overlay;
      // console.log('✅ OverlayManager.show() completed successfully');
    } else {
      console.error('❌ Overlay not found or missing show method:', { name, overlay });
    }
  }

  hideCurrent() {
    if (this.current && this.current.hide) {
      this.current.hide();
      this.current = null;
    }
  }
}
