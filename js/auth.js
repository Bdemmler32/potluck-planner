// Get references to Firebase auth (initialized in index.html)
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Current user data
let currentUser = null;

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        };
        
        // Save user to database if new
        saveUserToDatabase(currentUser);
        
        // Update UI for authenticated user
        updateAuthUI(true);
        
        // Always navigate to home screen after sign-in
        navigateToEventList();
        
        // Load user's events (both hosted and joined)
        loadUserEvents(currentUser.uid);
    } else {
        // User is signed out
        currentUser = null;
        updateAuthUI(false);
        
        // Show login view if on main page
        renderLoginView();
    }
});


// Render login view if not authenticated - Fixed for proper centering and button style
function renderLoginView() {
    const mainContent = document.getElementById('main-content');
    
    // Only render login view if we're on the main page (event list)
    if (currentView === 'eventList') {
        // Add login-page class to body
        document.body.classList.add('login-page');
        
        // Clear main content and set up the login container
        mainContent.innerHTML = `
            <div class="login-container">
                <div class="login-logo">
                    <img src="assets/logo-4f46e5.png" alt="Event Planner">
                </div>
                
                <button id="login-google-btn">
                    <i class="fab fa-google"></i> Sign in with Google
                </button>
            </div>
        `;
        
        // Style the button directly to match Google's standard sign-in button - Altered to match site Style
        const signInBtn = document.getElementById('login-google-btn');
        if (signInBtn) {
            // Apply Google-style button
            signInBtn.style.backgroundColor = '#4f46e5';
            signInBtn.style.color = 'white';
            signInBtn.style.border = '1px solid #dadce0';
            signInBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            signInBtn.style.padding = '0 16px';
            signInBtn.style.height = '40px';
            signInBtn.style.borderRadius = '4px';
            signInBtn.style.display = 'flex';
            signInBtn.style.alignItems = 'center';
            signInBtn.style.justifyContent = 'center';
            signInBtn.style.width = '220px';
            signInBtn.style.margin = '0 auto';
            signInBtn.style.fontWeight = '500';
            signInBtn.style.fontSize = '14px';
            signInBtn.style.cursor = 'pointer';
            
            // Style the Google icon - Altered to match site Style
            const googleIcon = signInBtn.querySelector('i');
            if (googleIcon) {
                googleIcon.style.color = 'white';
                googleIcon.style.marginRight = '24px';
                googleIcon.style.fontSize = '18px';
            }
            
            // Add hover effect - Altered to match site Style
            signInBtn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#6058e7';
                this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
            });
            
            signInBtn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#4f46e5';
                this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
            });
            
            // Add event listener for sign in
            signInBtn.addEventListener('click', signInWithGoogle);
        }
        
        // Center the login container vertically
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            loginContainer.style.display = 'flex';
            loginContainer.style.flexDirection = 'column';
            loginContainer.style.justifyContent = 'center';
            loginContainer.style.alignItems = 'center';
            loginContainer.style.minHeight = 'calc(100vh - var(--header-height) - 60px)';
            
            // Make the logo bigger
            const logo = loginContainer.querySelector('.login-logo');
            if (logo) {
                logo.style.width = '100%';
                logo.style.maxWidth = '400px';
                logo.style.margin = '0 auto 2rem';
            }
        }
        
        // Ensure the navigation buttons are shown but visibility hidden
        renderView();
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Save user to database
function saveUserToDatabase(user) {
    const userRef = database.ref(`users/${user.uid}`);
    
    // Update user data without overwriting events
    userRef.once('value', (snapshot) => {
        const userData = snapshot.val() || {};
        
        userRef.update({
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: firebase.database.ServerValue.TIMESTAMP,
            // Keep existing hostedEvents and joinedEvents if they exist
            hostedEvents: userData.hostedEvents || {},
            joinedEvents: userData.joinedEvents || {}
        });
    });
}

// Sign in with Google
function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error('Error signing in:', error);
            alert('Whoops, Failed to sign in. Please try again.');
        });
}

// Sign out - Fixed to ensure modal is closed and user is redirected
function signOut() {
    // First, make sure the modal is closed
    hideUserProfileModal();
    
    // Then sign out from Firebase
    auth.signOut()
        .then(() => {
            // Force redirect to login view, clearing any event details
            currentView = 'eventList';
            currentEventId = null;
            window.currentEventId = null;
            
            // Remove event ID from URL if present
            if (window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            // Reset UI
            document.body.classList.add('login-page');
            renderLoginView();
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
}

// Update UI based on auth state - Improved to ensure nav buttons are visible
function updateAuthUI(isAuthenticated) {
    // Remove login-page class if authenticated
    if (isAuthenticated) {
        document.body.classList.remove('login-page');
    } else {
        document.body.classList.add('login-page');
    }
    
    // Always make sure navigation buttons container is visible
    const navButtons = document.getElementById('nav-buttons');
    if (navButtons) {
        navButtons.style.display = 'flex';
    }
    
    // Update avatar and button state
    const userAvatar = document.getElementById('user-avatar');
    
    if (isAuthenticated && currentUser) {
        // Update user avatar and name
        if (userAvatar) {
            userAvatar.src = currentUser.photoURL || 'assets/default-avatar.png';
            userAvatar.style.display = 'block';
        }
    } else {
        // Reset UI for non-authenticated user
        if (userAvatar) {
            userAvatar.style.display = 'none';
        }
        
        // Show login view if on main page
        if (currentView === 'eventList') {
            renderLoginView();
        }
    }
    
    // Always make sure the view is properly rendered
    renderView();
}

// Load user's events (both hosted and joined)
function loadUserEvents(userId) {
    const userRef = database.ref(`users/${userId}`);
    
    userRef.once('value', (snapshot) => {
        const userData = snapshot.val() || {};
        const hostedEvents = userData.hostedEvents || {};
        const joinedEvents = userData.joinedEvents || {};
        
        // Combine hosted and joined event IDs
        const allEventIds = [...Object.keys(hostedEvents), ...Object.keys(joinedEvents)];
        
        // Load these events from the database
        if (allEventIds.length > 0) {
            fetchUserEvents(allEventIds);
        } else {
            // No events to load, show empty state
            document.dispatchEvent(new CustomEvent('eventsLoaded', { 
                detail: { events: {} }
            }));
        }
    });
}

// Fetch events by IDs
function fetchUserEvents(eventIds) {
    if (eventIds.length === 0) {
        // No events to load, show empty state
        document.dispatchEvent(new CustomEvent('eventsLoaded', { 
            detail: { events: {} }
        }));
        return;
    }
    
    const eventsRef = database.ref('events');
    const userEvents = {};
    
    // Create a promise for each event
    const promises = eventIds.map(eventId => {
        return eventsRef.child(eventId).once('value')
            .then((snapshot) => {
                const eventData = snapshot.val();
                if (eventData) {
                    userEvents[eventId] = {
                        ...eventData,
                        id: eventId // Add ID to the event data
                    };
                }
            });
    });
    
    // When all promises resolve, dispatch the events
    Promise.all(promises)
        .then(() => {
            document.dispatchEvent(new CustomEvent('eventsLoaded', { 
                detail: { events: userEvents }
            }));
        })
        .catch(error => {
            console.error('Error fetching events:', error);
        });
}

// Join an event by ID
async function joinEvent(eventId) {
    if (!currentUser) {
        alert('You must be signed in to join an event.');
        return false;
    }
    
    try {
        // Validate if the event exists
        const eventSnapshot = await database.ref(`events/${eventId}`).once('value');
        if (!eventSnapshot.exists()) {
            alert('Event not found. Please check the ID and try again.');
            return false;
        }
        
        // Check if already joined
        const userRef = database.ref(`users/${currentUser.uid}/joinedEvents/${eventId}`);
        const joined = await userRef.once('value');
        
        if (joined.exists()) {
            // Already joined, just navigate to it
            document.dispatchEvent(new CustomEvent('navigateToDetail', { 
                detail: { eventId: eventId }
            }));
            return true;
        }
        
        // Add this event to the user's joined events
        await userRef.set(true);
        
        // Navigate to the event detail
        document.dispatchEvent(new CustomEvent('navigateToDetail', { 
            detail: { eventId: eventId }
        }));
        
        return true;
    } catch (error) {
        console.error('Error joining event:', error);
        alert('Failed to join event. Please try again.');
        return false;
    }
}

// Leave an event - Updated to ensure proper functionality
async function leaveEvent(eventId) {
    if (!currentUser) return false;
    
    try {
        // Remove all the user's items from the event
        const eventItemsRef = database.ref(`events/${eventId}/items`);
        const items = await eventItemsRef.once('value');
        const itemsData = items.val() || {};
        
        // Find and remove all items belonging to the current user
        const userItemsPromises = Object.entries(itemsData).map(([itemId, item]) => {
            if (item.userId === currentUser.uid) {
                return eventItemsRef.child(itemId).remove();
            }
            return Promise.resolve();
        });
        
        // Wait for all user items to be removed
        await Promise.all(userItemsPromises);
        
        // Remove from joined events
        await database.ref(`users/${currentUser.uid}/joinedEvents/${eventId}`).remove();
        
        // Show success message
        showToast('You have left the event.');
        
        // Navigate back to the event list
        document.dispatchEvent(new Event('navigateToList'));
        
        return true;
    } catch (error) {
        console.error('Error leaving event:', error);
        alert('Failed to leave the event. Please try again.');
        return false;
    }
}

// Check if user is the host of an event
function isEventHost(event) {
    return currentUser && event && event.createdBy === currentUser.uid;
}

// Check if user has joined an event
async function hasJoinedEvent(eventId) {
    if (!currentUser) return false;
    
    try {
        const joined = await database.ref(`users/${currentUser.uid}/joinedEvents/${eventId}`).once('value');
        return joined.exists();
    } catch (error) {
        console.error('Error checking if joined event:', error);
        return false;
    }
}

// Show user profile modal
function showUserProfileModal() {
    const modal = document.getElementById('user-modal');
    
    if (currentUser) {
        // User is signed in - show profile
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('user-photo').src = currentUser.photoURL || 'assets/default-avatar.png';
        
        // Show sign out button
        document.getElementById('sign-in-section').style.display = 'none';
        document.getElementById('user-profile-section').style.display = 'block';
    } else {
        // User is not signed in - show sign in options
        document.getElementById('sign-in-section').style.display = 'block';
        document.getElementById('user-profile-section').style.display = 'none';
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Hide user profile modal
function hideUserProfileModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Set up event listeners - Improved close functionality
document.addEventListener('DOMContentLoaded', function() {
    // User profile modal
    const closeUserModal = document.getElementById('close-user-modal');
    const googleSignInBtn = document.getElementById('google-sign-in');
    const signOutBtn = document.getElementById('sign-out-btn');
    
    if (closeUserModal) {
        closeUserModal.addEventListener('click', function() {
            hideUserProfileModal();
        });
    }
    
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', signInWithGoogle);
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            signOut();
        });
    }
    
    // Handle ESC key to close modals
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            hideUserProfileModal();
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const userModal = document.getElementById('user-modal');
        if (e.target === userModal) {
            hideUserProfileModal();
        }
    });
});

// Custom event listeners for auth-related events
document.addEventListener('showUserProfileModal', showUserProfileModal);
document.addEventListener('joinEvent', function(e) {
    joinEvent(e.detail.eventId);
});
document.addEventListener('leaveEvent', function(e) {
    leaveEvent(e.detail.eventId);
});
