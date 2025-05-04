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

    eventForm.addEventListener('submit', handleEventFormSubmit);
    closeEventModal.addEventListener('click', hideEventModal);
    cancelEventBtn.addEventListener('click', hideEventModal);

    // Item Form listeners
    const itemForm = document.getElementById('item-form');
    const closeItemModal = document.getElementById('close-item-modal');
    const cancelItemBtn = document.getElementById('cancel-item-btn');

    itemForm.addEventListener('submit', handleItemFormSubmit);
    closeItemModal.addEventListener('click', hideItemModal);
    cancelItemBtn.addEventListener('click', hideItemModal);

    // Delete confirmation listeners
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    confirmDeleteBtn.addEventListener('click', confirmDeleteItem);
    cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    
    // Add dish button listener
    const addDishBtn = document.getElementById('add-dish-btn');
    addDishBtn.addEventListener('click', function() {
        const dishCount = document.querySelectorAll('.dish-entry').length;
        addDishTemplate('', 'Main Dish', dishCount);
    });
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
    
    // Add home button if not on event list
    if (currentView !== 'eventList') {
        const homeBtn = document.createElement('button');
        homeBtn.className = 'home-btn';
        homeBtn.innerHTML = '<i class="fas fa-home"></i> Home';
        homeBtn.addEventListener('click', () => {
            window.location.reload(); // Force a page reload
        });
        navButtons.appendChild(homeBtn);
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