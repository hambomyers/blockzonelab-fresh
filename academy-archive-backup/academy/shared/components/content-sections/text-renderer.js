/**
 * BLOCKZONE ACADEMY - TEXT RENDERER COMPONENT
 * Handles rendering of different text content types
 */

class TextRenderer {
    constructor(config = {}) {
        this.config = {
            enableMarkdown: true,
            enableSyntaxHighlighting: true,
            enableMathRendering: false,
            ...config
        };
        
        this.renderers = new Map();
        this.init();
    }
    
    init() {
        this.registerDefaultRenderers();
    }
    
    registerDefaultRenderers() {
        // Text content renderer
        this.registerRenderer('text', this.renderText.bind(this));
        
        // Story content renderer
        this.registerRenderer('story', this.renderStory.bind(this));
        
        // Fun fact renderer
        this.registerRenderer('fun-fact', this.renderFunFact.bind(this));
        
        // Comparison renderer
        this.registerRenderer('comparison', this.renderComparison.bind(this));
        
        // Timeline renderer
        this.registerRenderer('timeline', this.renderTimeline.bind(this));
        
        // Code block renderer
        this.registerRenderer('code', this.renderCode.bind(this));
        
        // Quote renderer
        this.registerRenderer('quote', this.renderQuote.bind(this));
    }
    
    registerRenderer(type, renderFunction) {
        this.renderers.set(type, renderFunction);
    }
    
    renderContent(contentBlock, container) {
        const renderer = this.renderers.get(contentBlock.type);
        if (renderer) {
            return renderer(contentBlock, container);
        } else {
            console.warn(`No renderer found for content type: ${contentBlock.type}`);
            return this.renderText(contentBlock, container);
        }
    }
    
    renderText(contentBlock, container) {
        const textElement = document.createElement('div');
        textElement.className = 'content-text';
        textElement.innerHTML = contentBlock.content;
        container.appendChild(textElement);
        return textElement;
    }
    
    renderStory(contentBlock, container) {
        const storyElement = document.createElement('div');
        storyElement.className = 'content-story';
        
        if (contentBlock.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'story-title';
            titleElement.textContent = contentBlock.title;
            storyElement.appendChild(titleElement);
        }
        
        const contentElement = document.createElement('div');
        contentElement.className = 'story-content';
        contentElement.innerHTML = contentBlock.content;
        storyElement.appendChild(contentElement);
        
        container.appendChild(storyElement);
        return storyElement;
    }
    
    renderFunFact(contentBlock, container) {
        const factElement = document.createElement('div');
        factElement.className = 'content-fun-fact';
        
        const iconElement = document.createElement('span');
        iconElement.className = 'fun-fact-icon';
        iconElement.textContent = '💡';
        factElement.appendChild(iconElement);
        
        const contentElement = document.createElement('div');
        contentElement.className = 'fun-fact-content';
        contentElement.innerHTML = contentBlock.content;
        factElement.appendChild(contentElement);
        
        container.appendChild(factElement);
        return factElement;
    }
    
    renderComparison(contentBlock, container) {
        const comparisonElement = document.createElement('div');
        comparisonElement.className = 'content-comparison';
        
        if (contentBlock.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'comparison-title';
            titleElement.textContent = contentBlock.title;
            comparisonElement.appendChild(titleElement);
        }
        
        if (contentBlock.items && Array.isArray(contentBlock.items)) {
            const gridElement = document.createElement('div');
            gridElement.className = 'comparison-grid';
            
            contentBlock.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'comparison-item';
                
                if (item.title) {
                    const itemTitle = document.createElement('h4');
                    itemTitle.className = 'item-title';
                    itemTitle.textContent = item.title;
                    itemElement.appendChild(itemTitle);
                }
                
                if (item.description) {
                    const itemDesc = document.createElement('p');
                    itemDesc.className = 'item-description';
                    itemDesc.innerHTML = item.description;
                    itemElement.appendChild(itemDesc);
                }
                
                gridElement.appendChild(itemElement);
            });
            
            comparisonElement.appendChild(gridElement);
        }
        
        container.appendChild(comparisonElement);
        return comparisonElement;
    }
    
    renderTimeline(contentBlock, container) {
        const timelineElement = document.createElement('div');
        timelineElement.className = 'content-timeline';
        
        if (contentBlock.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'timeline-title';
            titleElement.textContent = contentBlock.title;
            timelineElement.appendChild(titleElement);
        }
        
        if (contentBlock.events && Array.isArray(contentBlock.events)) {
            const eventsElement = document.createElement('div');
            eventsElement.className = 'timeline-events';
            
            contentBlock.events.forEach((event, index) => {
                const eventElement = document.createElement('div');
                eventElement.className = 'timeline-event';
                
                if (event.date) {
                    const dateElement = document.createElement('div');
                    dateElement.className = 'event-date';
                    dateElement.textContent = event.date;
                    eventElement.appendChild(dateElement);
                }
                
                if (event.title) {
                    const titleElement = document.createElement('h4');
                    titleElement.className = 'event-title';
                    titleElement.textContent = event.title;
                    eventElement.appendChild(titleElement);
                }
                
                if (event.description) {
                    const descElement = document.createElement('p');
                    descElement.className = 'event-description';
                    descElement.innerHTML = event.description;
                    eventElement.appendChild(descElement);
                }
                
                eventsElement.appendChild(eventElement);
            });
            
            timelineElement.appendChild(eventsElement);
        }
        
        container.appendChild(timelineElement);
        return timelineElement;
    }
    
    renderCode(contentBlock, container) {
        const codeElement = document.createElement('div');
        codeElement.className = 'content-code';
        
        if (contentBlock.language) {
            const languageElement = document.createElement('div');
            languageElement.className = 'code-language';
            languageElement.textContent = contentBlock.language;
            codeElement.appendChild(languageElement);
        }
        
        const preElement = document.createElement('pre');
        const codeElementInner = document.createElement('code');
        codeElementInner.textContent = contentBlock.content;
        preElement.appendChild(codeElementInner);
        codeElement.appendChild(preElement);
        
        container.appendChild(codeElement);
        return codeElement;
    }
    
    renderQuote(contentBlock, container) {
        const quoteElement = document.createElement('blockquote');
        quoteElement.className = 'content-quote';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'quote-content';
        contentElement.innerHTML = contentBlock.content;
        quoteElement.appendChild(contentElement);
        
        if (contentBlock.author) {
            const authorElement = document.createElement('cite');
            authorElement.className = 'quote-author';
            authorElement.textContent = `— ${contentBlock.author}`;
            quoteElement.appendChild(authorElement);
        }
        
        container.appendChild(quoteElement);
        return quoteElement;
    }
    
    destroy() {
        this.renderers.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextRenderer;
} else {
    window.TextRenderer = TextRenderer;
} 