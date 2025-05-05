// Fix for header buttons disappearing on hard refresh
window.addEventListener('load', () => {
    // Force renderView on page load to ensure header elements are visible
    setTimeout(() => {
        // Always render nav buttons on page load, regardless of user state
        renderView();
        
        // Then update visibility based on auth state
        if (currentUser && document.getElementById('nav-buttons')) {
            const navButtons = document.getElementById('nav-buttons');
            // Force display to ensure buttons are visible
            navButtons.style.display = 'flex';
        }
    }, 300); // Shorter delay for faster UI response
});

// Get Firebase database reference (Firebase already initialized in index.html)
const database = firebase.database();

// DOM Elements
const mainContent = document.getElementById('main-content');
const navButtons = document.getElementById('nav-buttons');

// Application State
let currentView = 'eventList'; // eventList, eventDetail
let currentEventId = null;
let currentItemId = null;
const eventDetailData = {}; // To store the currently viewed event's data
let userHasRsvpd = false; // Track if user has already RSVP'd

// Make currentEventId available globally to help with event ID tracking
window.currentEventId = null;

// Current Date for checking if events are past
const currentDate = new Date();

// Ensure the scroll position is at the top when loading a page
function scrollToTop() {
    window.scrollTo(0, 0);
}

// Initialize the app
function initApp() {
    // Check if there's an event ID in the URL
    checkUrlForEventId();
    
    // Set up event listeners for global elements
    setupEventListeners();
    
    // Force display of nav buttons
    const navButtons = document.getElementById('nav-buttons');
    if (navButtons) {
        navButtons.style.display = 'flex';
    }
    
    // Always render the view, regardless of auth state
    renderView();
    
    // Auth will handle loading events when user is authenticated
    // If no user is authenticated, the login view will be shown
}

// Check URL for event ID parameter
function checkUrlForEventId() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        // Validate if the event exists and automatically join
        validateAndJoinEvent(eventId);
    }
}

// Validate and join an event from URL
async function validateAndJoinEvent(eventId) {
    try {
        // Check if event exists
        const eventRef = database.ref(`events/${eventId}`);
        const snapshot = await eventRef.once('value');
        
        if (snapshot.exists()) {
            // Event exists, join it (this will happen after auth)
            setTimeout(() => {
                // Small delay to ensure auth has initialized
                if (currentUser) {
                    joinEvent(eventId);
                } else {
                    // Store eventId to join after login
                    localStorage.setItem('pendingEventId', eventId);
                }
            }, 1000);
        } else {
            console.error('Event not found:', eventId);
            // Clear the URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (error) {
        console.error('Error validating event:', error);
    }
}

// Setup main event listeners
function setupEventListeners() {
    // Custom events for communication between files
    document.addEventListener('eventsLoaded', function(e) {
        if (currentView === 'eventList') {
            // Let events.js know to render the event list
            const event = new CustomEvent('renderEventList', { 
                detail: { events: e.detail.events }
            });
            document.dispatchEvent(event);
            
            // Check for pending event join after login
            const pendingEventId = localStorage.getItem('pendingEventId');
            if (pendingEventId && currentUser) {
                localStorage.removeItem('pendingEventId');
                joinEvent(pendingEventId);
            }
        }
    });
    
    document.addEventListener('navigateToDetail', function(e) {
        navigateToEventDetail(e.detail.eventId);
    });
    
    document.addEventListener('navigateToList', function() {
        navigateToEventList();
    });
    
    // Form event listeners
    const eventForm = document.getElementById('event-form');
    const closeEventModal = document.getElementById('close-event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');

    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            document.dispatchEvent(new Event('submitEventForm'));
        });
    }
    
    if (closeEventModal) {
        closeEventModal.addEventListener('click', function() {
            document.dispatchEvent(new Event('hideEventModal'));
        });
    }
    
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', function() {
            document.dispatchEvent(new Event('hideEventModal'));
        });
    }
    
    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', function() {
            const eventId = document.getElementById('event-id').value;
            if (eventId) {
                showDeleteEventConfirmation(eventId);
            }
        });
    }

    // Item Form listeners
    const itemForm = document.getElementById('item-form');
    const closeItemModal = document.getElementById('close-item-modal');
    const cancelItemBtn = document.getElementById('cancel-item-btn');

    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            document.dispatchEvent(new Event('submitItemForm'));
        });
    }
    
    if (closeItemModal) {
        closeItemModal.addEventListener('click', function() {
            document.dispatchEvent(new Event('hideItemModal'));
        });
    }
    
    if (cancelItemBtn) {
        cancelItemBtn.addEventListener('click', function() {
            document.dispatchEvent(new Event('hideItemModal'));
        });
    }

    // Delete confirmation listeners
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            document.dispatchEvent(new Event('confirmDelete'));
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            document.dispatchEvent(new Event('hideConfirmModal'));
        });
    }
    
    // Delete event confirmation listeners
    const confirmDeleteEventBtn = document.getElementById('confirm-delete-event-btn');
    const cancelDeleteEventBtn = document.getElementById('cancel-delete-event-btn');
    
    if (confirmDeleteEventBtn) {
        confirmDeleteEventBtn.addEventListener('click', function() {
            const eventId = document.getElementById('delete-event-id-confirm').value;
            if (eventId) {
                deleteEvent(eventId);
            }
        });
    }
    
    if (cancelDeleteEventBtn) {
        cancelDeleteEventBtn.addEventListener('click', function() {
            hideDeleteEventConfirmModal();
        });
    }
    
    // Leave event confirmation listeners
    const confirmLeaveBtn = document.getElementById('confirm-leave-btn');
    const cancelLeaveBtn = document.getElementById('cancel-leave-btn');
    
    if (confirmLeaveBtn) {
        confirmLeaveBtn.addEventListener('click', function() {
            const eventId = document.getElementById('leave-event-id').value;
            if (eventId) {
                leaveEvent(eventId);
            }
            hideLeaveEventModal();
        });
    }
    
    if (cancelLeaveBtn) {
        cancelLeaveBtn.addEventListener('click', function() {
            hideLeaveEventModal();
        });
    }
    
    // Join Event Modal listeners
    const joinEventForm = document.getElementById('join-event-form');
    const closeJoinModal = document.getElementById('close-join-modal');
    const cancelJoinBtn = document.getElementById('cancel-join-btn');
    
    if (joinEventForm) {
        joinEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const eventId = document.getElementById('event-id-input').value.trim();
            if (eventId) {
                document.dispatchEvent(new CustomEvent('joinEvent', {
                    detail: { eventId: eventId }
                }));
                hideJoinEventModal();
            }
        });
    }
    
    if (closeJoinModal) {
        closeJoinModal.addEventListener('click', hideJoinEventModal);
    }
    
    if (cancelJoinBtn) {
        cancelJoinBtn.addEventListener('click', hideJoinEventModal);
    }
    
    // Share Modal listeners
    const closeShareModal = document.getElementById('close-share-modal');
    const copyIdBtn = document.getElementById('copy-id-btn');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const shareEmailBtn = document.getElementById('share-email-btn');
    const shareTextBtn = document.getElementById('share-text-btn');
    
    if (closeShareModal) {
        closeShareModal.addEventListener('click', hideShareModal);
    }
    
    if (copyIdBtn) {
        copyIdBtn.addEventListener('click', copyEventId);
    }
    
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', copyEventUrl);
    }
    
    if (shareEmailBtn) {
        shareEmailBtn.addEventListener('click', function() {
            const eventId = document.getElementById('share-event-id').textContent;
            const eventName = eventDetailData.event ? eventDetailData.event.name : 'Event';
            shareViaEmail(eventId, eventName);
        });
    }
    
    if (shareTextBtn) {
        shareTextBtn.addEventListener('click', function() {
            const eventId = document.getElementById('share-event-id').textContent;
            const eventName = eventDetailData.event ? eventDetailData.event.name : 'Event';
            shareViaSMS(eventId, eventName);
        });
    }
}

// Navigation Functions
function navigateToEventList() {
    currentView = 'eventList';
    currentEventId = null;
    window.currentEventId = null; // Update global variable
    userHasRsvpd = false; // Reset RSVP status
    
    // Remove event ID from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Always render the view, even before events are loaded
    renderView();
    
    // If user is authenticated, load their events
    if (currentUser) {
        loadUserEvents(currentUser.uid);
    } else {
        // Show login view
        renderLoginView();
    }
    
    // Scroll to top
    scrollToTop();
}

function navigateToEventDetail(eventId) {
    currentView = 'eventDetail';
    currentEventId = eventId;
    
    // Store the current event ID in a global variable that other scripts can access
    window.currentEventId = eventId;
    
    // Update URL with event ID
    window.history.replaceState({}, document.title, `${window.location.pathname}?id=${eventId}`);
    
    // Get the event data
    const eventRef = database.ref(`events/${eventId}`);
    eventRef.on('value', (snapshot) => {
        const eventData = snapshot.val();
        if (eventData) {
            // Store event data in application state
            eventDetailData.event = eventData;
            eventDetailData.event.id = eventId;
            
            // Check if user has RSVP'd for this event
            checkIfUserHasRsvpd(eventId, eventData);
            
            // Render the view
            renderView();
            
            // Let event.js know to render the detail view
            document.dispatchEvent(new CustomEvent('renderEventDetail', {
                detail: { event: eventDetailData.event }
            }));
            
            // Scroll to top
            scrollToTop();
        } else {
            // Event not found, go back to list
            navigateToEventList();
        }
    });
}

// Check if the current user has already RSVP'd
function checkIfUserHasRsvpd(eventId, eventData) {
    userHasRsvpd = false;
    
    if (currentUser && eventData && eventData.items) {
        // Check each item to see if any belong to the current user
        Object.entries(eventData.items).forEach(([id, item]) => {
            if (item.userId === currentUser.uid) {
                userHasRsvpd = true;
                // Store the item ID for potential editing
                currentItemId = id;
            }
        });
    }
}

// View Rendering - Updated to always show navigation buttons
function renderView() {
    // Clear nav buttons and re-add based on view
    if (navButtons) {
        navButtons.innerHTML = '';
        
        // Home button (always first)
        const homeBtn = document.createElement('button');
        homeBtn.className = 'header-home-btn';
        homeBtn.title = 'Home';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        homeBtn.addEventListener('click', navigateToEventList);
        navButtons.appendChild(homeBtn);
        
        if (currentView === 'eventDetail') {
            // Show action buttons for event detail view
            const event = eventDetailData.event;
            if (event) {
                const isPast = new Date(event.date) < new Date();
                const isHost = currentUser && event.createdBy === currentUser.uid;
                
                // Edit button (only for event owner and non-past events)
                if (isHost && !isPast) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'header-home-btn';
                    editBtn.title = 'Edit Event';
                    editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    editBtn.addEventListener('click', function() {
                        document.dispatchEvent(new CustomEvent('showEditEventModal', {
                            detail: { event: event }
                        }));
                    });
                    navButtons.appendChild(editBtn);
                }
                
                // Share button (only if event is public)
                if (event.isPublic !== false) {
                    const shareBtn = document.createElement('button');
                    shareBtn.className = 'header-home-btn';
                    shareBtn.title = 'Share';
                    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
                    shareBtn.addEventListener('click', function() {
                        showShareModal(event.id);
                    });
                    navButtons.appendChild(shareBtn);
                }
            }
        }
        
        // User profile button (always last, and always shown)
        const userBtn = document.createElement('button');
        userBtn.className = 'header-home-btn';
        userBtn.id = 'auth-button';
        userBtn.title = 'User Profile';
        
        if (currentUser) {
            userBtn.innerHTML = `<img id="user-avatar" src="${currentUser.photoURL || 'assets/default-avatar.png'}" alt="User" class="user-avatar">`;
        } else {
            userBtn.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        userBtn.addEventListener('click', function() {
            document.dispatchEvent(new Event('showUserProfileModal'));
        });
        navButtons.appendChild(userBtn);
        
        // Force display to ensure visibility
        navButtons.style.display = 'flex';
    }
}

// Show Delete Event Confirmation
function showDeleteEventConfirmation(eventId) {
    const modal = document.getElementById('confirm-delete-event-modal');
    document.getElementById('delete-event-id-confirm').value = eventId;
    modal.style.display = 'block';
}

// Hide Delete Event Confirmation Modal
function hideDeleteEventConfirmModal() {
    const modal = document.getElementById('confirm-delete-event-modal');
    modal.style.display = 'none';
}

// Delete an event
async function deleteEvent(eventId) {
    if (!currentUser) {
        hideDeleteEventConfirmModal();
        return;
    }
    
    try {
        // Check if the user is the event owner
        const eventRef = database.ref(`events/${eventId}`);
        const snapshot = await eventRef.once('value');
        const eventData = snapshot.val();
        
        if (!eventData || eventData.createdBy !== currentUser.uid) {
            alert('Only the event host can delete an event');
            hideDeleteEventConfirmModal();
            return;
        }
        
        // Remove event from database
        await eventRef.remove();
        
        // Remove from user's hosted events
        await database.ref(`users/${currentUser.uid}/hostedEvents/${eventId}`).remove();
        
        // Go back to event list
        navigateToEventList();
        
        // Hide the confirmation modal
        hideDeleteEventConfirmModal();
        
        // Show success message
        showToast('Event successfully deleted');
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
        hideDeleteEventConfirmModal();
    }
}

// Show Leave Event Confirmation
function showLeaveEventModal(eventId) {
    const modal = document.getElementById('leave-event-modal');
    document.getElementById('leave-event-id').value = eventId;
    modal.style.display = 'block';
}

// Hide Leave Event Confirmation Modal
function hideLeaveEventModal() {
    const modal = document.getElementById('leave-event-modal');
    modal.style.display = 'none';
}

// Show Join Event Modal
function showJoinEventModal() {
    const modal = document.getElementById('join-event-modal');
    const form = document.getElementById('join-event-form');
    
    // Reset the form
    form.reset();
    
    // Show the modal
    modal.style.display = 'block';
}

// Hide Join Event Modal
function hideJoinEventModal() {
    const modal = document.getElementById('join-event-modal');
    modal.style.display = 'none';
}

// Show Share Modal
function showShareModal(eventId) {
    const modal = document.getElementById('share-modal');
    const eventIdElement = document.getElementById('share-event-id');
    const eventUrlElement = document.getElementById('share-event-url');
    
    // Set event ID and URL
    const eventUrl = `${window.location.origin}${window.location.pathname}?id=${eventId}`;
    eventIdElement.textContent = eventId;
    eventUrlElement.textContent = eventUrl;
    
    // Show the modal
    modal.style.display = 'block';
}

// Hide Share Modal
function hideShareModal() {
    const modal = document.getElementById('share-modal');
    modal.style.display = 'none';
}

// Copy event ID to clipboard
function copyEventId() {
    const eventId = document.getElementById('share-event-id').textContent;
    navigator.clipboard.writeText(eventId)
        .then(() => {
            showToast('Event ID copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

// Copy event URL to clipboard
function copyEventUrl() {
    const eventUrl = document.getElementById('share-event-url').textContent;
    navigator.clipboard.writeText(eventUrl)
        .then(() => {
            showToast('Event URL copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

// Share via email
function shareViaEmail(eventId, eventName) {
    const eventUrl = `${window.location.origin}${window.location.pathname}?id=${eventId}`;
    const subject = `Join my Event: ${eventName}`;
    const body = `Please join my event by clicking this link: ${eventUrl}\n\nOr use this Event ID: ${eventId}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Share via text (SMS)
function shareViaSMS(eventId, eventName) {
    const eventUrl = `${window.location.origin}${window.location.pathname}?id=${eventId}`;
    const message = `Join my event: ${eventName}. Event ID: ${eventId} or use this link: ${eventUrl}`;
    
    // For mobile devices
    if (/Android|iPhone/i.test(navigator.userAgent)) {
        window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    } else {
        // Show a message for desktop users
        alert('To share via text message, please use a mobile device or copy the Event ID/URL to send manually.');
    }
}

// Display toast message
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

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
