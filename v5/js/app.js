// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWfziCIR8JvV7QePq43zQ-yiHoypC5UCI",
  authDomain: "bobs-potluck-planner.firebaseapp.com",
  databaseURL: "https://bobs-potluck-planner-default-rtdb.firebaseio.com",
  projectId: "bobs-potluck-planner",
  storageBucket: "bobs-potluck-planner.firebasestorage.app",
  messagingSenderId: "569139416139",
  appId: "1:569139416139:web:4f7cd99d3bb5cbb5e251ce",
  measurementId: "G-WSZGYWQS48"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const mainContent = document.getElementById('main-content');
const navButtons = document.getElementById('nav-buttons');

// Application State
let currentView = 'eventList'; // eventList, eventDetail
let currentEventId = null;
let currentItemId = null;
const eventDetailData = {}; // To store the currently viewed event's data

// Current Date for checking if events are past
const currentDate = new Date();

// Initialize the app
function initApp() {
    // Set up event listeners for global elements
    setupEventListeners();
    
    // Get events from Firebase
    const eventsRef = database.ref('events');
    eventsRef.on('value', (snapshot) => {
        const eventsData = snapshot.val() || {};
        
        // Render the event list view initially
        document.dispatchEvent(new CustomEvent('eventsLoaded', { 
            detail: { events: eventsData }
        }));
    });
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
}

// Navigation Functions
function navigateToEventList() {
    currentView = 'eventList';
    currentEventId = null;
    renderView();
}

function navigateToEventDetail(eventId) {
    currentView = 'eventDetail';
    currentEventId = eventId;
    
    // Store the current event ID in a global variable that other scripts can access
    window.currentEventId = eventId;
    
    // Get the event data
    const eventRef = database.ref(`events/${eventId}`);
    eventRef.on('value', (snapshot) => {
        const eventData = snapshot.val();
        if (eventData) {
            // Store event data in application state
            eventDetailData.event = eventData;
            eventDetailData.event.id = eventId;
            
            // Render the view
            renderView();
            
            // Let event.js know to render the detail view
            document.dispatchEvent(new CustomEvent('renderEventDetail', {
                detail: { event: eventDetailData.event }
            }));
        } else {
            // Event not found, go back to list
            navigateToEventList();
        }
    });
}

// View Rendering - Just handles navigation buttons - MODIFIED to remove info button
function renderView() {
    // Clear nav buttons and re-add based on view
    navButtons.innerHTML = '';
    
    if (currentView === 'eventList') {
        // Just show home button on the home screen
        const homeBtn = document.createElement('button');
        homeBtn.className = 'header-home-btn';
        homeBtn.title = 'Home';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        homeBtn.addEventListener('click', () => {
            window.location.reload(); // Force a page reload
        });
        navButtons.appendChild(homeBtn);
    } else if (currentView === 'eventDetail') {
        // Show action buttons for event detail view, REMOVING the info button
        const event = eventDetailData.event;
        if (event) {
            // Let events.js check if the event is past
            const isPast = new Date(event.date) < new Date();
            
            // REMOVED INFO BUTTON
            
            // Share button
            const shareBtn = document.createElement('button');
            shareBtn.className = 'header-home-btn';
            shareBtn.title = 'Share';
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
            shareBtn.addEventListener('click', function() {
                document.dispatchEvent(new Event('showShareMessage'));
            });
            navButtons.appendChild(shareBtn);
            
            // Edit button (only for non-past events)
            if (!isPast) {
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
            
            // Home button (always last)
            const homeBtn = document.createElement('button');
            homeBtn.className = 'header-home-btn';
            homeBtn.title = 'Home';
            homeBtn.innerHTML = '<i class="fas fa-home"></i>';
            homeBtn.addEventListener('click', () => {
                window.location.reload(); // Force a page reload
            });
            navButtons.appendChild(homeBtn);
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);