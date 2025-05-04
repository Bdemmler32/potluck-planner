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

// Load all events from Firebase
function loadEvents() {
    // Get a reference to the events collection
    const eventsRef = database.ref('events');
    
    // Listen for value changes
    eventsRef.on('value', (snapshot) => {
        renderEventListView(snapshot.val());
    });
}

// Initialize the app
function initApp() {
    // Load events and render the event list view
    loadEvents();

    // Setup event listeners for global elements
    setupEventListeners();
}

// Setup main event listeners
function setupEventListeners() {
    // Event Form listeners
    const eventForm = document.getElementById('event-form');
    const closeEventModal = document.getElementById('close-event-modal');
    const cancelEventBtn = document.getElementById('cancel-event-btn');

    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Get form data
            const eventId = document.getElementById('event-id').value;
            const name = document.getElementById('event-name').value;
            const host = document.getElementById('host-name').value;
            const date = document.getElementById('event-date').value;
            const time = document.getElementById('event-time').value;
            const location = document.getElementById('event-location').value;
            const description = document.getElementById('event-description').value;
            
            // Validate required fields
            if (!name || !host || !date || !time || !location) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Prepare event data
            const eventData = {
                name,
                host,
                date,
                time,
                location,
                description
            };
            
            // Create or update the event in Firebase
            if (eventId) {
                // Update existing event
                updateEvent(eventId, eventData);
            } else {
                // Create new event
                createEvent(eventData);
            }
            
            // Hide the modal
            hideEventModal();
        });
    }
    
    if (closeEventModal) {
        closeEventModal.addEventListener('click', hideEventModal);
    }
    
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', hideEventModal);
    }

    // Item Form listeners
    const itemForm = document.getElementById('item-form');
    const closeItemModal = document.getElementById('close-item-modal');
    const cancelItemBtn = document.getElementById('cancel-item-btn');

    if (itemForm) {
        itemForm.addEventListener('submit', handleItemFormSubmit);
    }
    
    if (closeItemModal) {
        closeItemModal.addEventListener('click', hideItemModal);
    }
    
    if (cancelItemBtn) {
        cancelItemBtn.addEventListener('click', hideItemModal);
    }

    // Delete confirmation listeners
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteItem);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    }
    
    // Add dish button listener
    const addDishBtn = document.getElementById('add-dish-btn');
    if (addDishBtn) {
        addDishBtn.addEventListener('click', function() {
            const dishCount = document.querySelectorAll('.dish-entry').length;
            addDishTemplate('', 'Main Dish', dishCount);
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
    loadEventDetail(eventId);
}

// View Rendering
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
        // Show action buttons for event detail view
        const event = eventDetailData.event;
        if (event) {
            const isPastEvent = isEventPast(event.date);
            
            // Info button
            const infoBtn = document.createElement('button');
            infoBtn.className = 'header-home-btn';
            infoBtn.title = 'Event Details';
            infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
            infoBtn.addEventListener('click', toggleEventDetails);
            navButtons.appendChild(infoBtn);
            
            // Share button
            const shareBtn = document.createElement('button');
            shareBtn.className = 'header-home-btn';
            shareBtn.title = 'Share';
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
            shareBtn.addEventListener('click', showShareMessage);
            navButtons.appendChild(shareBtn);
            
            // Edit button (only for non-past events)
            if (!isPastEvent) {
                const editBtn = document.createElement('button');
                editBtn.className = 'header-home-btn';
                editBtn.title = 'Edit Event';
                editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                editBtn.addEventListener('click', () => {
                    showEditEventModal(event);
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

    // Render the appropriate view
    switch (currentView) {
        case 'eventList':
            renderEventListView();
            break;
        case 'eventDetail':
            renderEventDetailView();
            break;
        default:
            renderEventListView();
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);