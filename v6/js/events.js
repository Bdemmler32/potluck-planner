// Add this at the beginning of the file to fix the renderItemsList reference issue
if (typeof renderItemsList !== 'function') {
    // This is a minimal implementation that will prevent errors
    // It will be overridden by the real implementation from items.js if loaded later
    function renderItemsList(items = {}, filterCategory = 'All') {
        const itemsContainer = document.getElementById('items-container');
        if (!itemsContainer) return;
        
        itemsContainer.innerHTML = '';
        
        if (Object.keys(items).length === 0) {
            // No items message
            const noItems = document.createElement('div');
            noItems.className = 'no-items';
            noItems.textContent = 'No items in this category yet. Add the first one!';
            itemsContainer.appendChild(noItems);
            return;
        }
        
        // Try to dispatch an event that items.js might be listening for
        document.dispatchEvent(new CustomEvent('renderItemsNeeded', { 
            detail: { items, filterCategory }
        }));
    }
}

// Event Management Functions

// Check if an event is past
function isEventPast(eventDate) {
    // Try parsing both date formats (MM/DD/YYYY and Month Day, Year)
    let date;
    
    if (eventDate && eventDate.includes('/')) {
        // MM/DD/YYYY format
        const parts = eventDate.split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            date = new Date(year, month, day);
        }
    } else {
        // Month Day, Year format or other
        date = new Date(eventDate);
    }
    
    // If date parsing failed, return false
    if (isNaN(date)) return false;
    
    // Create a date for tomorrow (to include the event day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Return true if the event date is before tomorrow
    return date < tomorrow;
}

// Create an event card element
function createEventCard(event, isPast = false) {
    const card = document.createElement('div');
    card.className = `event-card ${isPast ? 'past-event' : ''}`;
    card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('navigateToDetail', { 
            detail: { eventId: event.id }
        }));
    });
    
    // Count items and guests
    const itemCount = event.items ? Object.keys(event.items).length : 0;
    let guestCount = 0;
    
    // Calculate total guest count from all RSVPs
    if (event.items) {
        Object.values(event.items).forEach(item => {
            guestCount += item.guestCount || 1; // Default to 1 if not specified (for backward compatibility)
        });
    }
    
    // Format date if needed to MM/DD/YYYY
    let formattedDate = event.date;
    if (event.date && !event.date.includes('/')) {
        const dateParts = new Date(event.date);
        if (!isNaN(dateParts.getTime())) {
            const month = String(dateParts.getMonth() + 1).padStart(2, '0');
            const day = String(dateParts.getDate()).padStart(2, '0');
            const year = dateParts.getFullYear();
            formattedDate = `${month}/${day}/${year}`;
        }
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
                <span>${formattedDate}</span>
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
            <i class="fas fa-arrow-right view-details"></i>
        </div>
    `;
    
    // Prevent propagation on the "View Details" button to avoid double navigations
    const viewDetailsBtn = card.querySelector('.view-details');
    viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('navigateToDetail', { 
            detail: { eventId: event.id }
        }));
    });
    
    return card;
}

// Count items by category
function countItemsByCategory(items, category) {
    return Object.values(items).filter(item => {
        // Handle both old and new formats
        if (Array.isArray(item.dishes) && item.dishes.length > 0) {
            return item.dishes.some(dish => dish.category === category);
        } else {
            return item.category === category;
        }
    }).length;
}

// Render Event List View - Updated to remove extra "Create New Event" button and "Potluck" references
function renderEventListView(eventsData = {}) {
    const mainContent = document.getElementById('main-content');
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
    upcomingTitle.textContent = 'Upcoming Events';
    
    // Removed createBtn from the header
    eventsHeader.appendChild(upcomingTitle);
    
    mainContent.appendChild(eventsHeader);
    
    // Upcoming Events Section
    const upcomingSection = document.createElement('div');
    
    if (upcomingEvents.length === 0) {
        // No upcoming events message - Removed "Potluck"
        const noEvents = document.createElement('div');
        noEvents.className = 'no-events';
        
        // No button inside container, just message
        noEvents.innerHTML = `
            <p>No upcoming events. Create a new one!</p>
        `;
        
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
        pastEventsTitle.textContent = 'Past Events';
        mainContent.appendChild(pastEventsTitle);
        
        const pastEventsList = document.createElement('div');
        pastEventsList.className = 'event-list';
        
        pastEvents.forEach(event => {
            pastEventsList.appendChild(createEventCard(event, true));
        });
        
        mainContent.appendChild(pastEventsList);
    }
    
    // Add floating Create Event button - only button visible now
    const createEventBtn = document.createElement('button');
    createEventBtn.className = 'floating-btn';
    createEventBtn.innerHTML = `
        <i class="fas fa-plus-circle"></i>
        <span>Create New Event</span>
    `;
    createEventBtn.addEventListener('click', showCreateEventModal);
    mainContent.appendChild(createEventBtn);
}

// Render Event Detail View - Updated to fix RSVP button text
function renderEventDetailView(event) {
    if (!event) return;
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    
    // Check if event is past
    const isPastEvent = isEventPast(event.date);
    
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
    
    // Share Message (initially hidden)
    const shareMessageDiv = document.createElement('div');
    shareMessageDiv.className = 'success-message';
    shareMessageDiv.style.display = 'none';
    shareMessageDiv.textContent = 'Link copied to clipboard!';
    mainContent.appendChild(shareMessageDiv);
    
    // Event Details Panel - Format date if needed
    let formattedDate = event.date;
    if (event.date && !event.date.includes('/')) {
        const dateParts = new Date(event.date);
        if (!isNaN(dateParts.getTime())) {
            const month = String(dateParts.getMonth() + 1).padStart(2, '0');
            const day = String(dateParts.getDate()).padStart(2, '0');
            const year = dateParts.getFullYear();
            formattedDate = `${month}/${day}/${year}`;
        }
    }
    
    const detailsPanel = document.createElement('div');
    detailsPanel.className = 'event-details-panel';
    // No longer hidden by default
    detailsPanel.innerHTML = `
        <div class="event-details-header">
            <h3 class="event-detail-title">${event.name}</h3>
        </div>
        <div class="event-detail-row"><strong>Host:</strong> ${event.host}</div>
        <div class="event-detail-row"><strong>When:</strong> ${formattedDate}, ${event.time}</div>
        <div class="event-detail-row"><strong>Where:</strong> ${event.location}</div>
        ${event.description ? `<div class="event-detail-row">${event.description}</div>` : ''}
    `;
    
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
            filterItems(category, event);
        });
    });
    
    // Items Container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items-container';
    itemsContainer.id = 'items-container';
    mainContent.appendChild(itemsContainer);
    
    // Render items
    renderItemsList(event.items || {}, 'All');
    
    // Add floating RSVP button (only for non-past events)
    if (!isPastEvent) {
        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'floating-btn';
        addItemBtn.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <span>RSVP</span>
        `;
        addItemBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('showAddItemModal', { 
                detail: { eventId: event.id }
            }));
        });
        mainContent.appendChild(addItemBtn);
    }
}

// Filter items by category
function filterItems(category, event) {
    renderItemsList(event.items || {}, category);
}

// MODIFIED - removing the toggleEventDetails function as it's no longer needed
// Function signature kept but empty for backward compatibility
function toggleEventDetails() {
    // No longer needed as details are always visible
}

// Show share message
function showShareMessage() {
    const message = document.querySelector('.success-message');
    if (message) {
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }
}

// Event Modal Functions - Updated to remove "Potluck" reference
function showCreateEventModal() {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('save-event-btn');
    
    // Reset the form
    form.reset();
    document.getElementById('event-id').value = '';
    
    // Set title and button text for create mode - Removed "Potluck"
    title.textContent = 'Create New Event';
    submitBtn.textContent = 'Create Event';
    
    // Show the modal
    modal.style.display = 'block';
}

function showEditEventModal(event) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('save-event-btn');
    
    // Fill the form with event data
    document.getElementById('event-name').value = event.name;
    document.getElementById('host-name').value = event.host;
    
    // Format date to MM/DD/YYYY if needed
    let formattedDate = event.date;
    if (event.date && !event.date.includes('/')) {
        const dateParts = new Date(event.date);
        if (!isNaN(dateParts.getTime())) {
            const month = String(dateParts.getMonth() + 1).padStart(2, '0');
            const day = String(dateParts.getDate()).padStart(2, '0');
            const year = dateParts.getFullYear();
            formattedDate = `${month}/${day}/${year}`;
        }
    }
    document.getElementById('event-date').value = formattedDate;
    
    document.getElementById('event-time').value = event.time;
    document.getElementById('event-location').value = event.location;
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-id').value = event.id;
    
    // Set title and button text for edit mode - Removed "Potluck"
    title.textContent = 'Edit Event';
    submitBtn.textContent = 'Save Changes';
    
    // Show the modal
    modal.style.display = 'block';
}

function hideEventModal() {
    const modal = document.getElementById('event-modal');
    modal.style.display = 'none';
}

function handleEventFormSubmit() {
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
}

// Create a new event
function createEvent(eventData) {
    // Get a reference to the events collection and generate a new ID
    const eventsRef = database.ref('events');
    const newEventRef = eventsRef.push();
    
    // Save the event data
    newEventRef.set({
        ...eventData,
        items: {}
    }).then(() => {
        // Navigate to the new event
        document.dispatchEvent(new CustomEvent('navigateToDetail', { 
            detail: { eventId: newEventRef.key }
        }));
    }).catch(error => {
        console.error('Error creating event:', error);
        alert('Failed to create event. Please try again.');
    });
}

// Update an existing event
function updateEvent(eventId, eventData) {
    // Get a reference to the specific event
    const eventRef = database.ref(`events/${eventId}`);
    
    // Update the event data (without affecting items)
    eventRef.update(eventData).then(() => {
        // Stay on the event detail page, it will update automatically
    }).catch(error => {
        console.error('Error updating event:', error);
        alert('Failed to update event. Please try again.');
    });
}

// Set up event listeners for communication between files
document.addEventListener('renderEventList', function(e) {
    renderEventListView(e.detail.events);
});

document.addEventListener('renderEventDetail', function(e) {
    renderEventDetailView(e.detail.event);
});

document.addEventListener('toggleEventDetails', toggleEventDetails);
document.addEventListener('showShareMessage', showShareMessage);
document.addEventListener('showEditEventModal', function(e) {
    showEditEventModal(e.detail.event);
});
document.addEventListener('hideEventModal', hideEventModal);
document.addEventListener('submitEventForm', handleEventFormSubmit);