// console.log('>>> event-bus.js loaded', import.meta.url, performance.now());
class EventBus {
  constructor() { this.listeners = {}; }
  on(event, handler) { (this.listeners[event] ||= []).push(handler); }
  off(event, handler) { this.listeners[event] = (this.listeners[event] || []).filter(h => h !== handler); }
  emit(event, data) { (this.listeners[event] || []).forEach(h => h(data)); }
}

export default EventBus;
