// Simple Ad Placeholder System

// Ad configuration - can be expanded later
const adConfig = {
    desktop: [
        {
            src: 'assets/ads/ad-placeholder-300x250.svg',
            alt: 'Advertisement',
            width: 300,
            height: 250,
            link: '#'
        },
        {
            src: 'assets/ads/ad-placeholder-160x600.svg',
            alt: 'Advertisement',
            width: 160,
            height: 600,
            link: '#'
        },
        {
            src: 'assets/ads/ad-placeholder-300x250.svg',
            alt: 'Advertisement',
            width: 300,
            height: 250,
            link: '#'
        }
    ],
    mobile: [
        {
            src: 'assets/ads/ad-placeholder-300x250.svg',
            alt: 'Advertisement',
            width: 300,
            height: 250,
            link: '#'
        },
        {
            src: 'assets/ads/ad-placeholder-300x250.svg',
            alt: 'Advertisement',
            width: 300,
            height: 250,
            link: '#'
        }
    ]
};

// Initialize the ad container
function initializeAdSpace() {
    const adContainer = document.querySelector('.ad-space-column');
    if (!adContainer) return;
    
    // Clear existing ads
    adContainer.innerHTML = '';
    
    // Determine if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const ads = isMobile ? adConfig.mobile : adConfig.desktop;
    
    // Add ad slots
    ads.forEach((ad, index) => {
        const adElement = document.createElement('div');
        adElement.className = 'ad-container';
        
        adElement.innerHTML = `
            <h4>Advertisement</h4>
            <a href="${ad.link}" target="_blank" rel="noopener">
                <img 
                    src="${ad.src}" 
                    alt="${ad.alt}" 
                    width="${ad.width}" 
                    height="${ad.height}" 
                    class="ad-placeholder">
            </a>
        `;
        
        adContainer.appendChild(adElement);
    });
}

// Set up rotation if needed
function setupAdRotation(interval = 30000) {
    // This is a placeholder for future rotation functionality
    let currentAdIndex = 0;
    const adContainers = document.querySelectorAll('.ad-container');
    
    if (adContainers.length <= 1) return; // No need for rotation with 0 or 1 ads
    
    // Set up rotation interval
    setInterval(() => {
        // Simple rotation: just hide current and show next
        const isMobile = window.innerWidth <= 768;
        const ads = isMobile ? adConfig.mobile : adConfig.desktop;
        
        if (ads.length <= 1) return; // No need to rotate with only one ad
        
        currentAdIndex = (currentAdIndex + 1) % ads.length;
        
        // Update all containers
        adContainers.forEach((container, index) => {
            const adIndex = (currentAdIndex + index) % ads.length;
            const ad = ads[adIndex];
            
            // Update the image
            const img = container.querySelector('img');
            if (img) {
                img.src = ad.src;
                img.alt = ad.alt;
                img.width = ad.width;
                img.height = ad.height;
            }
            
            // Update the link
            const link = container.querySelector('a');
            if (link) {
                link.href = ad.link;
            }
        });
    }, interval);
}

// Handle window resize to adjust ads
function handleResize() {
    initializeAdSpace();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initial setup
    window.addEventListener('resize', handleResize);
});

// Listen for event detail view rendered to initialize ads
document.addEventListener('eventDetailRendered', function() {
    setTimeout(initializeAdSpace, 100);
});

// Export functions for external use
window.adSystem = {
    initialize: initializeAdSpace,
    setupRotation: setupAdRotation
};