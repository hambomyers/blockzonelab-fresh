/**
 * BLOCKZONE ACADEMY - TIMELINE COMPONENT
 * Handles rendering of timeline content and interactive timelines
 */

class Timeline {
    constructor(config = {}) {
        this.config = {
            enableAnimations: true,
            enableInteractive: true,
            enableProgress: true,
            ...config
        };
        
        this.timelines = new Map();
        this.init();
    }
    
    init() {
        if (this.config.enableAnimations) {
            this.setupAnimations();
        }
    }
    
    createTimeline(container, timelineData, options = {}) {
        const timelineId = `timeline-${Date.now()}`;
        const timelineElement = document.createElement('div');
        timelineElement.className = 'content-timeline';
        timelineElement.id = timelineId;
        
        const timelineConfig = {
            orientation: options.orientation || 'vertical',
            layout: options.layout || 'standard',
            showDates: options.showDates !== false,
            showProgress: this.config.enableProgress && options.showProgress !== false,
            ...options
        };
        
        timelineElement.classList.add(`timeline-${timelineConfig.orientation}`);
        timelineElement.classList.add(`timeline-${timelineConfig.layout}`);
        
        if (timelineConfig.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'timeline-title';
            titleElement.textContent = timelineConfig.title;
            timelineElement.appendChild(titleElement);
        }
        
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'timeline-events';
        
        if (timelineData.events && Array.isArray(timelineData.events)) {
            timelineData.events.forEach((event, index) => {
                const eventElement = this.createTimelineEvent(event, index, timelineConfig);
                eventsContainer.appendChild(eventElement);
            });
        }
        
        timelineElement.appendChild(eventsContainer);
        
        if (timelineConfig.showProgress) {
            const progressElement = this.createProgressBar(timelineData.events.length);
            timelineElement.appendChild(progressElement);
        }
        
        container.appendChild(timelineElement);
        
        this.timelines.set(timelineId, {
            element: timelineElement,
            data: timelineData,
            config: timelineConfig,
            currentEvent: 0
        });
        
        return timelineId;
    }
    
    createTimelineEvent(event, index, config) {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-event';
        eventElement.dataset.eventIndex = index;
        
        if (config.orientation === 'horizontal') {
            eventElement.classList.add('event-horizontal');
        }
        
        // Event marker/connector
        const markerElement = document.createElement('div');
        markerElement.className = 'event-marker';
        
        if (event.type) {
            markerElement.classList.add(`marker-${event.type}`);
        }
        
        if (event.icon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'event-icon';
            iconElement.textContent = event.icon;
            markerElement.appendChild(iconElement);
        }
        
        eventElement.appendChild(markerElement);
        
        // Event content
        const contentElement = document.createElement('div');
        contentElement.className = 'event-content';
        
        if (config.showDates && event.date) {
            const dateElement = document.createElement('div');
            dateElement.className = 'event-date';
            dateElement.textContent = event.date;
            contentElement.appendChild(dateElement);
        }
        
        if (event.title) {
            const titleElement = document.createElement('h4');
            titleElement.className = 'event-title';
            titleElement.textContent = event.title;
            contentElement.appendChild(titleElement);
        }
        
        if (event.description) {
            const descElement = document.createElement('p');
            descElement.className = 'event-description';
            descElement.innerHTML = event.description;
            contentElement.appendChild(descElement);
        }
        
        if (event.details) {
            const detailsElement = document.createElement('div');
            detailsElement.className = 'event-details';
            detailsElement.innerHTML = event.details;
            contentElement.appendChild(detailsElement);
        }
        
        if (event.media) {
            const mediaElement = this.createEventMedia(event.media);
            contentElement.appendChild(mediaElement);
        }
        
        eventElement.appendChild(contentElement);
        
        // Add interactive features
        if (this.config.enableInteractive) {
            this.makeEventInteractive(eventElement, index);
        }
        
        return eventElement;
    }
    
    createEventMedia(mediaData) {
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'event-media';
        
        if (mediaData.type === 'image') {
            const image = document.createElement('img');
            image.src = mediaData.src;
            image.alt = mediaData.alt || '';
            image.className = 'event-image';
            mediaContainer.appendChild(image);
        } else if (mediaData.type === 'video') {
            const video = document.createElement('video');
            video.src = mediaData.src;
            video.controls = true;
            video.preload = 'metadata';
            video.className = 'event-video';
            mediaContainer.appendChild(video);
        } else if (mediaData.type === 'link') {
            const link = document.createElement('a');
            link.href = mediaData.url;
            link.textContent = mediaData.text || 'Learn More';
            link.className = 'event-link';
            link.target = '_blank';
            mediaContainer.appendChild(link);
        }
        
        return mediaContainer;
    }
    
    createProgressBar(totalEvents) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'timeline-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = '0%';
        
        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = '0 / ' + totalEvents;
        progressContainer.appendChild(progressText);
        
        return progressContainer;
    }
    
    makeEventInteractive(eventElement, index) {
        eventElement.addEventListener('click', () => {
            this.selectEvent(index);
        });
        
        eventElement.addEventListener('mouseenter', () => {
            this.highlightEvent(index);
        });
        
        eventElement.addEventListener('mouseleave', () => {
            this.unhighlightEvent(index);
        });
    }
    
    selectEvent(eventIndex) {
        // Remove previous selection
        document.querySelectorAll('.timeline-event.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to current event
        const eventElement = document.querySelector(`[data-event-index="${eventIndex}"]`);
        if (eventElement) {
            eventElement.classList.add('selected');
        }
        
        // Update progress
        this.updateProgress(eventIndex);
        
        // Emit selection event
        document.dispatchEvent(new CustomEvent('timelineEventSelected', {
            detail: { eventIndex, eventElement }
        }));
    }
    
    highlightEvent(eventIndex) {
        const eventElement = document.querySelector(`[data-event-index="${eventIndex}"]`);
        if (eventElement) {
            eventElement.classList.add('highlighted');
        }
    }
    
    unhighlightEvent(eventIndex) {
        const eventElement = document.querySelector(`[data-event-index="${eventIndex}"]`);
        if (eventElement) {
            eventElement.classList.remove('highlighted');
        }
    }
    
    updateProgress(currentEvent) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            const timeline = document.querySelector('.content-timeline');
            const totalEvents = timeline.querySelectorAll('.timeline-event').length;
            const progress = ((currentEvent + 1) / totalEvents) * 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${currentEvent + 1} / ${totalEvents}`;
        }
    }
    
    setupAnimations() {
        if ('IntersectionObserver' in window) {
            const eventObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            document.addEventListener('DOMContentLoaded', () => {
                const timelineEvents = document.querySelectorAll('.timeline-event');
                timelineEvents.forEach(event => eventObserver.observe(event));
            });
        }
    }
    
    navigateToEvent(timelineId, eventIndex) {
        const timeline = this.timelines.get(timelineId);
        if (timeline) {
            this.selectEvent(eventIndex);
            
            // Scroll to event
            const eventElement = timeline.element.querySelector(`[data-event-index="${eventIndex}"]`);
            if (eventElement) {
                eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    nextEvent(timelineId) {
        const timeline = this.timelines.get(timelineId);
        if (timeline && timeline.currentEvent < timeline.data.events.length - 1) {
            timeline.currentEvent++;
            this.navigateToEvent(timelineId, timeline.currentEvent);
        }
    }
    
    previousEvent(timelineId) {
        const timeline = this.timelines.get(timelineId);
        if (timeline && timeline.currentEvent > 0) {
            timeline.currentEvent--;
            this.navigateToEvent(timelineId, timeline.currentEvent);
        }
    }
    
    getTimeline(timelineId) {
        return this.timelines.get(timelineId);
    }
    
    destroyTimeline(timelineId) {
        const timeline = this.timelines.get(timelineId);
        if (timeline && timeline.element.parentNode) {
            timeline.element.parentNode.removeChild(timeline.element);
            this.timelines.delete(timelineId);
        }
    }
    
    destroy() {
        this.timelines.forEach((timeline, id) => {
            this.destroyTimeline(id);
        });
        this.timelines.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Timeline;
} else {
    window.Timeline = Timeline;
} 