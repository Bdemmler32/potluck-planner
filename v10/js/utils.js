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

// Function to ensure header navigation elements are always visible
function ensureHeaderNavigation() {
    const navButtons = document.getElementById('nav-buttons');
    if (navButtons) {
        navButtons.style.display = 'flex';
    }
}

// Function to handle proper alignment of content with header
function alignContentWithHeader() {
    const header = document.querySelector('.app-header');
    const mainContent = document.getElementById('main-content');
    
    if (header && mainContent) {
        const headerPadding = getComputedStyle(header).paddingLeft;
        mainContent.style.paddingLeft = headerPadding;
        mainContent.style.paddingRight = headerPadding;
    }
}

// Window resize handler to ensure responsive behavior
window.addEventListener('resize', function() {
    ensureHeaderNavigation();
    alignContentWithHeader();
});

// DOMContentLoaded handler to initialize utility functions
document.addEventListener('DOMContentLoaded', function() {
    ensureHeaderNavigation();
    alignContentWithHeader();
});
