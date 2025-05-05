// Completely Reworked Ad Rotation System

// Define ad configuration
const adConfig = {
    // Specific ad files to use for rotation
    adFiles: [
        {
            src: 'assets/ads/ad-placeholder-300x250.svg',
            link: 'https://example.com/ad1',
            alt: 'Advertisement 1'
        },
        {
            src: 'assets/ads/ad-placeholder-300x250_2.svg',
            link: 'https://example.com/ad2',
            alt: 'Advertisement 2'
        },
        {
            src: 'assets/ads/ad-placeholder-300x250_3.svg',
            link: 'https://example.com/ad3',
            alt: 'Advertisement 3'
        }
    ],
    // Rotation interval in milliseconds (30 seconds)
    rotationInterval: 30000
};

// Current ad index
let currentAdIndex = 0;
let rotationTimer = null;

// Initialize the ad container
function initializeAdSpace() {
    // Check if we're on the event detail page
    if (currentView !== 'eventDetail') return;
    
    // Find main content container
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // Find the items-section
    const itemsSection = mainContent.querySelector('.items-section');
    if (!itemsSection) return;
    
    // Create ad space container if it doesn't exist
    let adSpaceContainer = mainContent.querySelector('.ad-space-container');
    
    if (!adSpaceContainer) {
        adSpaceContainer = document.createElement('div');
        adSpaceContainer.className = 'ad-space-container';
        
        // Create ad container
        const adContainer = document.createElement('div');
        adContainer.className = 'ad-container';
        
        // Insert the ad container into the ad space
        adSpaceContainer.appendChild(adContainer);
        
        // Insert the ad space after the items section
        itemsSection.after(adSpaceContainer);
    }
    
    // Set initial ad
    updateAd(0);
    
    // Start rotation
    startAdRotation();
}

// Update the ad with the specified index
function updateAd(index) {
    const adContainer = document.querySelector('.ad-container');
    if (!adContainer) return;
    
    // Get the ad data
    const ad = adConfig.adFiles[index];
    
    // Create link element
    const link = document.createElement('a');
    link.href = ad.link;
    link.target = '_blank';
    link.rel = 'noopener';
    
    // Create image element
    const img = document.createElement('img');
    img.src = ad.src;
    img.alt = ad.alt;
    img.width = 300;
    img.height = 250;
    img.className = 'ad-placeholder';
    
    // Apply a fade effect
    img.style.opacity = '0';
    
    // Add image to link
    link.appendChild(img);
    
    // Clear ad container
    adContainer.innerHTML = '';
    
    // Add link to ad container
    adContainer.appendChild(link);
    
    // Trigger reflow
    void img.offsetWidth;
    
    // Fade in
    img.style.opacity = '1';
    
    // Update current index
    currentAdIndex = index;
}

// Start ad rotation
function startAdRotation() {
    // Clear existing timer if any
    if (rotationTimer) {
        clearInterval(rotationTimer);
    }
    
    // Set up rotation timer
    rotationTimer = setInterval(() => {
        // Calculate next ad index
        const nextIndex = (currentAdIndex + 1) % adConfig.adFiles.length;
        
        // Update ad
        updateAd(nextIndex);
    }, adConfig.rotationInterval);
}

// Stop ad rotation
function stopAdRotation() {
    if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
    }
}

// Clean up when leaving the page
function cleanUp() {
    stopAdRotation();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // We'll initialize on the event detail rendered event
});

// Listen for event detail view rendered
document.addEventListener('eventDetailRendered', function() {
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
        initializeAdSpace();
    }, 200);
});

// Clean up when leaving event detail view
document.addEventListener('navigateToList', function() {
    cleanUp();
});

// Listen for window resize to adjust ads
window.addEventListener('resize', function() {
    // Check if we're on event detail page
    if (currentView === 'eventDetail') {
        // Reinitialize ad space
        initializeAdSpace();
    }
});

// Export functions for external use
window.adSystem = {
    initialize: initializeAdSpace,
    startRotation: startAdRotation,
    stopRotation: stopAdRotation,
    updateAd: updateAd
};