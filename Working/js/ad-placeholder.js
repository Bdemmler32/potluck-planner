// Improved Ad Rotation System with fixed ad files

// Define base configuration
const adConfig = {
    desktop: [
        {
            width: 300,
            height: 250,
            link: '#'
        }
    ],
    mobile: [
        {
            width: 300,
            height: 250,
            link: '#'
        }
    ]
};

// Specific ad files to use for rotation
const adFiles = [
    'assets/ads/ad-placeholder-300x250.svg',
    'assets/ads/ad-1.jpg',
    'assets/ads/ad-2.jpg',
    'assets/ads/ad-3.jpg',
    'assets/ads/ad-4.jpg'
];

// Current ad index
let currentAdIndex = 0;

// Get the next ad in rotation
function getNextAd() {
    // Get the next ad and increment the index
    const adSrc = adFiles[currentAdIndex];
    currentAdIndex = (currentAdIndex + 1) % adFiles.length;
    return adSrc;
}

// Initialize the ad container with properly sized ads
function initializeAdSpace() {
    const adContainer = document.querySelector('.ad-space-column');
    if (!adContainer) return;
    
    // Clear existing ads
    adContainer.innerHTML = '';
    
    // Determine if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const ads = isMobile ? adConfig.mobile : adConfig.desktop;
    
    // Add ad slots
    ads.forEach(() => {
        const adElement = document.createElement('div');
        adElement.className = 'ad-container';
        
        // Select the first ad to start
        const adSrc = adFiles[0];
        
        adElement.innerHTML = `
            <a href="#" target="_blank" rel="noopener">
                <img 
                    src="${adSrc}" 
                    alt="Advertisement" 
                    width="300" 
                    height="250" 
                    class="ad-placeholder">
            </a>
        `;
        
        adContainer.appendChild(adElement);
    });
    
    // Match ad container height to event details
    matchAdHeightToDetails();
}

// Match ad container height to event details container
function matchAdHeightToDetails() {
    const detailsPanel = document.querySelector('.event-details-panel');
    const adContainer = document.querySelector('.ad-container');
    
    if (detailsPanel && adContainer && window.innerWidth > 768) {
        // Get computed height of details panel
        const detailsHeight = detailsPanel.offsetHeight;
        adContainer.style.height = `${detailsHeight}px`;
    } else if (adContainer) {
        // Reset height on mobile
        adContainer.style.height = 'auto';
    }
}

// Set up rotation for ads
function setupAdRotation(interval = 5000) {
    // Don't set up rotation if there aren't enough ads
    if (adFiles.length <= 1) return;
    
    // Reset current index
    currentAdIndex = 0;
    
    // Set up rotation interval with a clean implementation
    const rotationTimer = setInterval(() => {
        const adContainers = document.querySelectorAll('.ad-container');
        if (adContainers.length === 0) {
            // No containers found, clear the interval
            clearInterval(rotationTimer);
            return;
        }
        
        // Get the next ad
        const nextAdSrc = getNextAd();
        
        // Apply to all ad containers with smooth transition
        adContainers.forEach(container => {
            const img = container.querySelector('img');
            if (img) {
                // Create new image element and set up transition
                const newImg = document.createElement('img');
                newImg.src = nextAdSrc;
                newImg.alt = "Advertisement";
                newImg.width = 300;
                newImg.height = 250;
                newImg.className = "ad-placeholder";
                
                // Use opacity for smooth transition
                newImg.style.opacity = 0;
                newImg.style.transition = 'opacity 0.5s ease-in-out';
                
                // Replace the old image
                if (img.parentNode) {
                    img.parentNode.replaceChild(newImg, img);
                    
                    // Trigger reflow
                    void newImg.offsetWidth;
                    
                    // Fade in
                    newImg.style.opacity = 1;
                }
            }
        });
    }, interval);
    
    // Store the timer ID for cleanup
    window.adRotationTimer = rotationTimer;
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
    // Clear any existing rotation timer
    if (window.adRotationTimer) {
        clearInterval(window.adRotationTimer);
        window.adRotationTimer = null;
    }
    
    // Initialize ad space with slight delay to ensure DOM is ready
    setTimeout(() => {
        initializeAdSpace();
        // Set up rotation after initializing
        setupAdRotation();
    }, 200);
    
    // Listen for any changes in the DOM that might affect heights
    const observer = new MutationObserver(() => {
        matchAdHeightToDetails();
    });
    
    // Start observing the main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        observer.observe(mainContent, { childList: true, subtree: true });
    }
});

// Export functions for external use
window.adSystem = {
    initialize: initializeAdSpace,
    setupRotation: setupAdRotation,
    matchHeights: matchAdHeightToDetails
};