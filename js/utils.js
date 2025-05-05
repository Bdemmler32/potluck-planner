// Utility Functions

// Format a date string
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format a time string
function formatTime(timeString) {
    return timeString; // No special formatting needed for the current format
}

// Generate a UUID (for cases where Firebase keys aren't available)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Check if an object is empty
function isEmptyObject(obj) {
    return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

// Convert Firebase object to array
function objectToArray(obj) {
    return obj ? Object.keys(obj).map(key => {
        return { id: key, ...obj[key] };
    }) : [];
}

// Escape HTML to prevent XSS attacks
function escapeHTML(str) {
    if (!str) return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Create element with HTML safely
function createElementWithHTML(tagName, className, html) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (html) element.innerHTML = html;
    return element;
}

// Toggle visibility of an element
function toggleVisibility(element) {
    if (!element) return;
    
    if (element.style.display === 'none') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

// Show a toast message
function showToast(message, duration = 3000) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-message');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-message';
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// Get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}

// Format a date for comparison (YYYY-MM-DD)
function formatDateForComparison(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Format 12-hour time to 24-hour
function formatTime12to24(time12h) {
    if (!time12h) return '';
    
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
        hours = '00';
    }
    
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}`;
}

// Format 24-hour time to 12-hour
function formatTime24to12(time24h) {
    if (!time24h) return '';
    
    const [hours, minutes] = time24h.split(':');
    let period = 'AM';
    let hours12 = parseInt(hours, 10);
    
    if (hours12 >= 12) {
        period = 'PM';
        if (hours12 > 12) {
            hours12 -= 12;
        }
    }
    
    if (hours12 === 0) {
        hours12 = 12;
    }
    
    return `${hours12}:${minutes} ${period}`;
}

// Check if the device is mobile
function isMobileDevice() {
    return (window.innerWidth <= 768);
}

// Add event listener with automatic cleanup
function addEventListenerWithCleanup(element, eventType, handler) {
    if (!element) return null;
    
    element.addEventListener(eventType, handler);
    
    // Return a cleanup function
    return () => {
        element.removeEventListener(eventType, handler);
    };
}

// Fix for leave event button functionality
function setupLeaveEventButton() {
    // Find any leave event buttons and ensure they have proper event listeners
    const leaveBtn = document.querySelector('.leave-event-btn');
    if (leaveBtn && !leaveBtn._hasClickListener) {
        leaveBtn.addEventListener('click', function() {
            if (currentEventId || window.currentEventId) {
                showLeaveEventModal(currentEventId || window.currentEventId);
            }
        });
        leaveBtn._hasClickListener = true;
    }
}

// Set up button handler for Google sign-in on login page
function setupLoginButton() {
    const loginBtn = document.getElementById('login-google-btn');
    if (loginBtn) {
        // Add event listener for sign in
        loginBtn.addEventListener('click', signInWithGoogle);
    }
}

// Initialize all UI components that need JavaScript enhancements
function initializeUIComponents() {
    // Set up user modal close functionality
    const userModal = document.getElementById('user-modal');
    const closeUserBtn = document.getElementById('close-user-modal');
    const signOutBtn = document.getElementById('sign-out-btn');
    
    if (userModal && closeUserBtn) {
        closeUserBtn.addEventListener('click', () => {
            userModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === userModal) {
                userModal.style.display = 'none';
            }
        });
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            // Make sure to hide the modal first before signing out
            if (userModal) {
                userModal.style.display = 'none';
            }
            // Then call signOut which is defined in auth.js
            if (typeof signOut === 'function') {
                signOut();
            }
        });
    }
    
    // Set up escape key handler for all modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Set up button event handlers for floating buttons
    setupFloatingButtons();
    
    // Set up login button if on login page
    if (document.body.classList.contains('login-page')) {
        setupLoginButton();
    }
}

// Set up floating buttons
function setupFloatingButtons() {
    const floatingBtns = document.querySelectorAll('.floating-btn');
    
    floatingBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('disabled')) {
                btn.style.backgroundColor = '#4338ca';
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('disabled')) {
                btn.style.backgroundColor = '';
            }
        });
    });
}

// Check page state and initialize components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initializeUIComponents();
    
    // Set up mutation observer to watch for leave button additions
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && 
                mutation.addedNodes.length > 0) {
                // Check for new buttons or UI elements that need handlers
                setupLeaveEventButton();
                setupFloatingButtons();
            }
        });
    });
    
    // Start observing main content for DOM changes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        observer.observe(mainContent, { childList: true, subtree: true });
    }
    
    // Apply adjustments when window resizes
    window.addEventListener('resize', () => {
        // Any resize adjustments can go here
    });
});

// Event listeners
document.addEventListener('renderEventDetail', () => {
    // Set up leave button after event detail is rendered
    setTimeout(setupLeaveEventButton, 100);
});

document.addEventListener('authStateChanged', (e) => {
    // Handle authentication state changes
});

document.addEventListener('modalOpened', (e) => {
    // Handle modal open events
});