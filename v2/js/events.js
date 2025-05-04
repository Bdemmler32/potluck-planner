// Event Management Functions

// Load all events from Firebase
function loadEvents() {
    // Get a reference to the events collection
    const eventsRef = database.ref('events');
    
    // Listen for value changes
    eventsRef.on('value', (snapshot) => {
        renderEventListView(snapshot.val());
    }

// Render Event Detail View
function renderEventDetailView() {
    if (!eventDetailData.event) return;
    
    const event = eventDetailData.event;
    mainContent.innerHTML = '';
    
    // Check if event is past
    const isPastEvent = isEventPast(event.date);
    
    // Event Header
    const eventHeader = document.createElement('div');
    eventHeader.className = 'event-detail-header';
    
    // Remove back button, add event title and action buttons
    eventHeader.innerHTML = `
        <h2 class="event-title">${event.name}</h2>
        <div class="event-actions">
            ${!isPastEvent ? `<button class="action-btn edit-event-btn" title="Edit Event"><i class="fas fa-pencil-alt"></i></button>` : ''}
            <button class="action-btn view-details-btn" title="Event Details"><i class="fas fa-info-circle"></i></button>
            <button class="action-btn share-btn" title="Share"><i class="fas fa-share-alt"></i></button>
            <button class="action-btn header-home-btn" title="Home"><i class="fas fa-home"></i></button>
        </div>
    `;
    
    mainContent.appendChild(eventHeader);
    
    // Set up event listeners on the header buttons
    if (!isPastEvent) {
        eventHeader.querySelector('.edit-event-btn').addEventListener('click', () => {
            showEditEventModal(event);
        });
    }
    
    eventHeader.querySelector('.view-details-btn').addEventListener('click', toggleEventDetails);
    eventHeader.querySelector('.share-btn').addEventListener('click', () => {
        showShareMessage();
    });
    eventHeader.querySelector('.header-home-btn').addEventListener('click', () => {
        window.location.reload(); // Force a page reload when going back home
    });
    
    // Share Message (initially hidden)
    const shareMessageDiv = document.createElement('div');
    shareMessageDiv.className = 'success-message';
    shareMessageDiv.style.display = 'none';
    shareMessageDiv.textContent = 'Link copied to clipboard!';
    mainContent.appendChild(shareMessageDiv);
    
    // Past event alert (if applicable)
    if (isPastEvent) {
        const pastAlert = document.createElement('div');
        pastAlert.className = 'past-event-alert';
        pastAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>This is a past event. Editing is no longer available.</p>
        `;
        mainContent.appendChild(pastAlert);
    }
    
    // Event Details Panel (initially hidden)
    const detailsPanel = document.createElement('div');
    detailsPanel.className = 'event-details-panel';
    detailsPanel.style.display = 'none';
    detailsPanel.innerHTML = `
        <div class="event-details-header">
            <h3 class="event-detail-title">${event.name}</h3>
            <button class="close-details-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="event-detail-row"><strong>Host:</strong> ${event.host}</div>
        <div class="event-detail-row"><strong>When:</strong> ${event.date}, ${event.time}</div>
        <div class="event-detail-row"><strong>Where:</strong> ${event.location}</div>
        ${event.description ? `<div class="event-detail-row">${event.description}</div>` : ''}
    `;
    
    // Add close button listener
    detailsPanel.querySelector('.close-details-btn').addEventListener('click', toggleEventDetails);
    
    mainContent.appendChild(detailsPanel);
    
    // Categories for filtering
    const categories = ['Appetizer', 'Main Dish', 'Side Dish', 'Dessert', 'Drink'];
    
    // Create filter tabs
    const filterTabs = document.createElement('div');
    filterTabs.className = 'filter-tabs';
    
    filterTabs.innerHTML = `
        <span class="filter-label"><i class="fas fa-filter"></i> Filter:</span>
        <button class="filter-tab active" data-category="All">All</button>
    `;
    
    // Add category tabs
    categories.forEach(category => {
        const count = countItemsByCategory(event.items || {}, category);
        const tab = document.createElement('button');
        tab.className = 'filter-tab';
        tab.setAttribute('data-category', category);
        tab.textContent = `${category} (${count})`;
        filterTabs.appendChild(tab);
    });
    
    mainContent.appendChild(filterTabs);
    
    // Add event listeners to filter tabs
    const tabs = filterTabs.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category');
            filterItems(category);
        });
    });
    
    // Items Container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items-container';
    itemsContainer.id = 'items-container';
    mainContent.appendChild(itemsContainer);
    
    // Render items
    renderItemsList(event.items || {}, 'All');
    
    // Add Item Button (only for non-past events) - Updated text
    if (!isPastEvent) {
        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'add-item-btn';
        addItemBtn.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <span>RSVP/Add Item</span>
        `;
        addItemBtn.addEventListener('click', () => showAddItemModal(event.id));
        mainContent.appendChild(addItemBtn);
    }
}

// Create an event card element
function createEventCard(event, isPast = false) {
    const card = document.createElement('div');
    card.className = `event-card ${isPast ? 'past-event' : ''}`;
    card.addEventListener('click', () => navigateToEventDetail(event.id));
    
    // Count items and guests
    const itemCount = event.items ? Object.keys(event.items).length : 0;
    let guestCount = 0;
    
    // Calculate total guest count from all RSVPs
    if (event.items) {
        Object.values(event.items).forEach(item => {
            guestCount += item.guestCount || 1; // Default to 1 if not specified (for backward compatibility)
        });
    }
    
    card.innerHTML = `
        <h3 class="event-title">${event.name}</h3>
        <div class="event-info">
            <div class="event-info-item">
                <i class="fas fa-user"></i>
                <span>Hosted by: ${event.host}</span>
            </div>
            <div class="event-info-item">
                <i class="fas fa-calendar"></i>
                <span>${event.date}</span>
            </div>
            <div class="event-info-item">
                <i class="fas fa-clock"></i>
                <span>${event.time}</span>
            </div>
            <div class="event-info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${event.location}</span>
            </div>
            <div class="event-info-item">
                <i class="fas fa-users"></i>
                <span>${guestCount} guest${guestCount !== 1 ? 's' : ''} attending</span>
            </div>
        </div>
        <div class="event-card-footer">
            <span class="item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
            <button class="view-details"><i class="fas fa-arrow-right"></i></button>
        </div>
    `;
    
    // Prevent propagation on the "View Details" button to avoid double navigations
    const viewDetailsBtn = card.querySelector('.view-details');
    viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToEventDetail(event.id);
    });
    
    return card;
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
    
    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Create New Event';
    createBtn.addEventListener('click', showCreateEventModal);
    
    eventsHeader.appendChild(upcomingTitle);
    eventsHeader.appendChild(createBtn);
    
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
}
    