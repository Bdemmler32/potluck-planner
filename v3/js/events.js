// Event Management Functions

// Load all events from Firebase
function loadEvents() {
    // Get a reference to the events collection
    const eventsRef = database.ref('events');
    
    // Listen for value changes
    eventsRef.on('value', (snapshot) => {
        renderEventListView(snapshot.val());
    });
}

// Load specific event details
function loadEventDetail(eventId) {
    const eventRef = database.ref(`events/${eventId}`);
    
    eventRef.on('value', (snapshot) => {
        const eventData = snapshot.val();
        if (eventData) {
            // Store event data in our application state
            eventDetailData.event = eventData;
            eventDetailData.event.id = eventId;
            
            // Render the event detail view
            renderEventDetailView();
        } else {
            // Event not found, go back to list
            navigateToEventList();
        }
    });
}

// Check if an event is past
function isEventPast(eventDate) {
    // Parse the date string (e.g., "June 15, 2025")
    const date = new Date(eventDate);
    
    // Create a date for tomorrow (to include the event day)
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Return true if the event date is before tomorrow
    return date < tomorrow;
}

// Render Event List View
function renderEventListView(eventsData = {}) {
    mainContent.innerHTML = '';
    
    // Convert events object to array and sort by date
    const events = Object.entries(eventsData || {}).map(([id, event]) => {
        return { id, ...event };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Separate events into upcoming and past
    const upcomingEvents = events.filter(event => !isEventPast(event.date));
    const pastEvents = events.filter(event => isEventPast(event.date));

    // Create the events header
    const eventsHeader = document.createElement('div');
    eventsHeader.className = 'events-header';
    
    const upcomingTitle = document.createElement('h2');
    upcomingTitle.className = 'section-title';
    upcomingTitle.textContent = 'Upcoming Potlucks';
    
    // Removed createBtn from the header, will be added as floating button
    
    eventsHeader.appendChild(upcomingTitle);
    // eventsHeader.appendChild(createBtn); // This line is removed
    
    mainContent.appendChild(eventsHeader);
    
    // Upcoming Events Section
    const upcomingSection = document.createElement('div');
    
    if (upcomingEvents.length === 0) {
        // No upcoming events message
        const noEvents = document.createElement('div');
        noEvents.className = 'no-events';
        
        noEvents.innerHTML = `
            <p>No upcoming potluck events. Create a new one!</p>
            <button class="btn btn-primary mt-6">
                <i class="fas fa-plus-circle"></i> Create New Event
            </button>
        `;
        
        noEvents.querySelector('button').addEventListener('click', showCreateEventModal);
        upcomingSection.appendChild(noEvents);
    } else {
        // Create event list grid
        const eventList = document.createElement('div');
        eventList.className = 'event-list';
        
        // Add event cards
        upcomingEvents.forEach(event => {
            eventList.appendChild(createEventCard(event));
        });
        
        upcomingSection.appendChild(eventList);
    }
    
    mainContent.appendChild(upcomingSection);
    
    // Past Events Section (only if there are past events)
    if (pastEvents.length > 0) {
        const pastEventsTitle = document.createElement('h2');
        pastEventsTitle.className = 'section-title past-events-title';
        pastEventsTitle.textContent = 'Past Potlucks';
        mainContent.appendChild(pastEventsTitle);
        
        const pastEventsList = document.createElement('div');
        pastEventsList.className = 'event-list';
        
        pastEvents.forEach(event => {
            pastEventsList.appendChild(createEventCard(event, true));
        });
        
        mainContent.appendChild(pastEventsList);
    }
    
    // Add floating Create Event button
    if (currentView === 'eventList') {
        const createEventBtn = document.createElement('button');
        createEventBtn.className = 'floating-btn';
        createEventBtn.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <span>Create New Event</span>
        `;
        createEventBtn.addEventListener('click', showCreateEventModal);
        mainContent.appendChild(createEventBtn);
    }
}