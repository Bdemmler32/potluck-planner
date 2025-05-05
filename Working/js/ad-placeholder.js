// Dynamic Ad Placeholder System - Updated for any file in assets/ads/ directory

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

// Array to store available ad images
let availableAds = [];

// Function to load available ads (simulated, as we can't scan directories client-side)
// In a real implementation, you would need to use server-side code to provide this list
function loadAvailableAds() {
    // Simulate available ads in the directory
    // In a real implementation, this would come from a server endpoint
    availableAds = [
        'assets/ads/ad-placeholder-300x250.svg',
        'assets/ads/ad-1.jpg',
        'assets/ads/ad-2.jpg',
        'assets/ads/ad-3.jpg',
        'assets/ads/ad-4.jpg'
    ];
    
    // Filter to make sure we only have valid files (in a real implementation)
    availableAds = availableAds.filter(ad => {
        // Ensure the file exists (this is just a placeholder check)
        return true;
    });
    
    // If no ads found, use the default placeholder
    if (availableAds.length === 0) {
        availableAds = ['assets/ads/ad-placeholder-300x250.svg'];
    }
    
    return availableAds;
}

// Get a random ad from available ads
function getRandomAd() {
    if (availableAds.length === 0) {
        loadAvailableAds();
    }
    
    const randomIndex = Math.floor(Math.random() * availableAds.length);
    return availableAds[randomIndex];
}

// Initialize the ad container with properly sized ads
function initializeAdSpace() {
    const adContainer = document.querySelector('.ad-space-column');
    if (!adContainer) return;
    
    // Load available ads if not already loaded
    if (availableAds.length === 0) {
        loadAvailableAds();
    }
    
    // Clear existing ads
    adContainer.innerHTML = '';
    
    // Determine if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const ads = isMobile ? adConfig.mobile : adConfig.desktop;
    
    // Add ad slots
    ads.forEach((ad, index) => {
        const adElement = document.createElement('div');
        adElement.className = 'ad-container';
        
        // Select a random ad from available ads
        const adSrc = getRandomAd();
        
        // No advertisement text anymore
        adElement.innerHTML = `
            <a href="${ad.link}" target="_blank" rel="noopener">
                <img 
                    src="${adSrc}" 
                    alt="Advertisement" 
                    width="${ad.width}" 
                    height="${ad.height}" 
                    class="ad-placeholder">
            </a>
        `;
        
        adContainer.appendChild(adElement);
    });
    
    // Make the ad container match the height of the event details
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
function setupAdRotation(interval = 10000) {
    // Don't set up rotation if there's not enough ads
    if (availableAds.length <= 1) return;
    
    // Set up rotation interval
    setInterval(() => {
        const adContainers = document.querySelectorAll('.ad-container');
        
        // Update all ad containers with new random ads
        adContainers.forEach(container => {
            const img = container.querySelector('img');
            if (img) {
                // Get a new random ad
                const adSrc = getRandomAd();
                img.src = adSrc;
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
    // Load available ads
    loadAvailableAds();
    
    // Initial setup
    window.addEventListener('resize', handleResize);
});

// Listen for event detail view rendered to initialize ads
document.addEventListener('eventDetailRendered', function() {
    setTimeout(() => {
        initializeAdSpace();
        // Set up rotation after initializing
        setupAdRotation();
    }, 100);
    
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