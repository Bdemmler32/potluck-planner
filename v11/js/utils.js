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

// Fix for header and nav buttons display
function ensureNavButtonsVisible() {
    const navButtons = document.getElementById('nav-buttons');
    if (navButtons) {
        navButtons.style.display = 'flex';
    }
}

// Fix alignment of header with content
function fixHeaderAlignment() {
    const header = document.querySelector('.app-header .container');
    const content = document.querySelector('#main-content');
    
    if (header && content) {
        // Set the same padding for both
        const padding = 'var(--gutter-xs)';
        header.style.paddingLeft = padding;
        header.style.paddingRight = padding;
        content.style.paddingLeft = padding;
        content.style.paddingRight = padding;
    }
}

// Fix for leave event button functionality
function fixLeaveEventButton() {
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

// Ensure proper modal button layout
function fixModalButtonLayout() {
    // For event modal - equal width buttons
    const eventFormActions = document.querySelector('#event-form .form-actions');
    if (eventFormActions) {
        eventFormActions.style.display = 'flex';
        eventFormActions.style.width = '100%';
        
        const buttons = eventFormActions.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.flex = '1';
        });
    }
    
    // For other modals with form actions
    const allFormActions = document.querySelectorAll('.form-actions');
    allFormActions.forEach(actions => {
        actions.style.display = 'flex';
        actions.style.width = '100%';
        
        const buttons = actions.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.flex = '1';
        });
    });
}

// Fix login page button style to match Google standard
function fixLoginButtonStyle() {
    const loginBtn = document.getElementById('login-google-btn');
    if (loginBtn) {
        // Standard Google sign-in button style
        loginBtn.style.backgroundColor = 'white';
        loginBtn.style.color = '#757575';
        loginBtn.style.border = '1px solid #dadce0';
        loginBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        loginBtn.style.padding = '0 16px';
        loginBtn.style.height = '40px';
        loginBtn.style.display = 'flex';
        loginBtn.style.alignItems = 'center';
        loginBtn.style.justifyContent = 'center';
        loginBtn.style.maxWidth = '240px';
        loginBtn.style.margin = '0 auto';
        loginBtn.style.fontWeight = '500';
        
        // Fix Google icon
        const googleIcon = loginBtn.querySelector('i');
        if (googleIcon) {
            googleIcon.style.color = '#4285F4';
            googleIcon.style.marginRight = '24px';
            googleIcon.style.marginLeft = '1px';
            googleIcon.style.fontSize = '18px';
        }
        
        // Add hover effect
        loginBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        });
        
        loginBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
            this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        });
    }
}

// Fix user profile modal to properly close
function fixUserProfileModal() {
    const userModal = document.getElementById('user-modal');
    const closeBtn = document.getElementById('close-user-modal');
    const signOutBtn = document.getElementById('sign-out-btn');
    
    if (userModal && closeBtn) {
        closeBtn.addEventListener('click', function() {
            userModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === userModal) {
                userModal.style.display = 'none';
            }
        });
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
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
    
    // Handle ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            if (userModal) {
                userModal.style.display = 'none';
            }
        }
    });
}

// Center the login container vertically
function centerLoginContainer() {
    if (document.body.classList.contains('login-page')) {
        const loginContainer = document.querySelector('.login-container');
        const mainContent = document.getElementById('main-content');
        
        if (loginContainer && mainContent) {
            loginContainer.style.display = 'flex';
            loginContainer.style.flexDirection = 'column';
            loginContainer.style.justifyContent = 'center';
            loginContainer.style.alignItems = 'center';
            loginContainer.style.height = '100%';
            
            // Enlarge the logo
            const logo = loginContainer.querySelector('.login-logo');
            if (logo) {
                logo.style.width = '100%';
                logo.style.maxWidth = '400px';
                logo.style.margin = '0 auto 2rem';
            }
        }
    }
}

// Check page state and apply fixes
document.addEventListener('DOMContentLoaded', function() {
    // Apply all fixes
    ensureNavButtonsVisible();
    fixHeaderAlignment();
    fixModalButtonLayout();
    fixLoginButtonStyle();
    fixUserProfileModal();
    centerLoginContainer();
    
    // Set up mutation observer to watch for leave button additions
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && 
                mutation.addedNodes.length > 0) {
                // Check for leave event button after DOM changes
                fixLeaveEventButton();
            }
        });
    });
    
    // Start observing main content for leave buttons
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        observer.observe(mainContent, { childList: true, subtree: true });
    }
    
    // Apply fixes when window resizes
    window.addEventListener('resize', function() {
        ensureNavButtonsVisible();
        fixHeaderAlignment();
        centerLoginContainer();
    });
    
    // Set up special handling for login page
    if (document.body.classList.contains('login-page')) {
        centerLoginContainer();
        fixLoginButtonStyle();
    }
});

// Event listener for when event details are rendered
document.addEventListener('renderEventDetail', function() {
    // Ensure leave button works after event detail is rendered
    setTimeout(fixLeaveEventButton, 100);
    // Fix header alignment
    fixHeaderAlignment();
});

// Event listener for authentication state changes
document.addEventListener('authStateChanged', function(e) {
    if (e.detail.isAuthenticated) {
        // User is signed in
        ensureNavButtonsVisible();
    } else {
        // User is signed out
        centerLoginContainer();
        fixLoginButtonStyle();
    }
});

// Fix for specific modals
document.addEventListener('modalOpened', function(e) {
    if (e.detail && e.detail.modalId) {
        if (e.detail.modalId === 'event-modal') {
            fixModalButtonLayout();
        }
    }
});
