/**
 * BLOCKZONE ACADEMY - MEDIA GALLERY COMPONENT
 * Handles rendering of images, videos, and interactive media
 */

class MediaGallery {
    constructor(config = {}) {
        this.config = {
            enableLightbox: true,
            enableLazyLoading: true,
            enableResponsiveImages: true,
            ...config
        };
        
        this.galleries = new Map();
        this.currentLightbox = null;
        this.init();
    }
    
    init() {
        if (this.config.enableLazyLoading) {
            this.setupLazyLoading();
        }
        
        if (this.config.enableLightbox) {
            this.setupLightbox();
        }
    }
    
    createGallery(container, mediaItems, options = {}) {
        const galleryId = `gallery-${Date.now()}`;
        const galleryElement = document.createElement('div');
        galleryElement.className = 'media-gallery';
        galleryElement.id = galleryId;
        
        const galleryConfig = {
            layout: options.layout || 'grid',
            columns: options.columns || 3,
            spacing: options.spacing || 'medium',
            ...options
        };
        
        galleryElement.classList.add(`gallery-${galleryConfig.layout}`);
        galleryElement.classList.add(`gallery-spacing-${galleryConfig.spacing}`);
        
        if (galleryConfig.layout === 'grid') {
            galleryElement.style.setProperty('--gallery-columns', galleryConfig.columns);
        }
        
        mediaItems.forEach((item, index) => {
            const mediaElement = this.createMediaItem(item, index);
            galleryElement.appendChild(mediaElement);
        });
        
        container.appendChild(galleryElement);
        
        this.galleries.set(galleryId, {
            element: galleryElement,
            items: mediaItems,
            config: galleryConfig
        });
        
        return galleryId;
    }
    
    createMediaItem(item, index) {
        const mediaElement = document.createElement('div');
        mediaElement.className = 'media-item';
        
        switch (item.type) {
            case 'image':
                return this.createImageItem(item, index);
            case 'video':
                return this.createVideoItem(item, index);
            case 'interactive':
                return this.createInteractiveItem(item, index);
            case 'chart':
                return this.createChartItem(item, index);
            default:
                return this.createImageItem(item, index);
        }
    }
    
    createImageItem(item, index) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'media-item image-item';
        
        const image = document.createElement('img');
        image.className = 'gallery-image';
        image.alt = item.alt || item.caption || '';
        
        if (this.config.enableLazyLoading) {
            image.loading = 'lazy';
            image.dataset.src = item.src;
            image.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        } else {
            image.src = item.src;
        }
        
        if (item.caption) {
            const caption = document.createElement('div');
            caption.className = 'media-caption';
            caption.textContent = item.caption;
            imageContainer.appendChild(caption);
        }
        
        if (this.config.enableLightbox) {
            image.classList.add('lightbox-trigger');
            image.dataset.lightboxIndex = index;
            image.dataset.lightboxSrc = item.src;
            image.dataset.lightboxCaption = item.caption || '';
        }
        
        imageContainer.appendChild(image);
        return imageContainer;
    }
    
    createVideoItem(item, index) {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'media-item video-item';
        
        const video = document.createElement('video');
        video.className = 'gallery-video';
        video.controls = true;
        video.preload = 'metadata';
        
        if (item.poster) {
            video.poster = item.poster;
        }
        
        if (item.sources && Array.isArray(item.sources)) {
            item.sources.forEach(source => {
                const sourceElement = document.createElement('source');
                sourceElement.src = source.src;
                sourceElement.type = source.type;
                video.appendChild(sourceElement);
            });
        } else if (item.src) {
            video.src = item.src;
        }
        
        if (item.caption) {
            const caption = document.createElement('div');
            caption.className = 'media-caption';
            caption.textContent = item.caption;
            videoContainer.appendChild(caption);
        }
        
        videoContainer.appendChild(video);
        return videoContainer;
    }
    
    createInteractiveItem(item, index) {
        const interactiveContainer = document.createElement('div');
        interactiveContainer.className = 'media-item interactive-item';
        
        const iframe = document.createElement('iframe');
        iframe.className = 'gallery-iframe';
        iframe.src = item.src;
        iframe.title = item.title || 'Interactive Content';
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
        
        if (item.aspectRatio) {
            iframe.style.aspectRatio = item.aspectRatio;
        }
        
        if (item.caption) {
            const caption = document.createElement('div');
            caption.className = 'media-caption';
            caption.textContent = item.caption;
            interactiveContainer.appendChild(caption);
        }
        
        interactiveContainer.appendChild(iframe);
        return interactiveContainer;
    }
    
    createChartItem(item, index) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'media-item chart-item';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'gallery-chart';
        canvas.id = `chart-${index}`;
        
        if (item.caption) {
            const caption = document.createElement('div');
            caption.className = 'media-caption';
            caption.textContent = item.caption;
            chartContainer.appendChild(caption);
        }
        
        chartContainer.appendChild(canvas);
        
        // Initialize chart if Chart.js is available
        if (window.Chart && item.chartData) {
            setTimeout(() => {
                this.initializeChart(canvas, item.chartData);
            }, 100);
        }
        
        return chartContainer;
    }
    
    initializeChart(canvas, chartData) {
        try {
            new Chart(canvas, chartData);
        } catch (error) {
            console.warn('Failed to initialize chart:', error);
        }
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.addEventListener('DOMContentLoaded', () => {
                const lazyImages = document.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => imageObserver.observe(img));
            });
        }
    }
    
    setupLightbox() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lightbox-trigger')) {
                e.preventDefault();
                this.openLightbox(e.target);
            }
        });
        
        // Close lightbox on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentLightbox) {
                this.closeLightbox();
            }
        });
    }
    
    openLightbox(imageElement) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <img src="${imageElement.dataset.lightboxSrc}" alt="${imageElement.alt}">
                ${imageElement.dataset.lightboxCaption ? `<div class="lightbox-caption">${imageElement.dataset.lightboxCaption}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(lightbox);
        this.currentLightbox = lightbox;
        
        // Close on button click
        lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
            this.closeLightbox();
        });
        
        // Close on background click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });
        
        // Animate in
        setTimeout(() => lightbox.classList.add('active'), 10);
    }
    
    closeLightbox() {
        if (this.currentLightbox) {
            this.currentLightbox.classList.remove('active');
            setTimeout(() => {
                if (this.currentLightbox && this.currentLightbox.parentNode) {
                    this.currentLightbox.parentNode.removeChild(this.currentLightbox);
                }
                this.currentLightbox = null;
            }, 300);
        }
    }
    
    getGallery(galleryId) {
        return this.galleries.get(galleryId);
    }
    
    destroyGallery(galleryId) {
        const gallery = this.galleries.get(galleryId);
        if (gallery && gallery.element.parentNode) {
            gallery.element.parentNode.removeChild(gallery.element);
            this.galleries.delete(galleryId);
        }
    }
    
    destroy() {
        this.galleries.forEach((gallery, id) => {
            this.destroyGallery(id);
        });
        
        if (this.currentLightbox) {
            this.closeLightbox();
        }
        
        this.galleries.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaGallery;
} else {
    window.MediaGallery = MediaGallery;
} 