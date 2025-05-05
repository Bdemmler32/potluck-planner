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

// Generate a unique event ID
async function generateEventId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure the ID is unique
    const snapshot = await database.ref(`events/${id}`).once('value');
    if (snapshot.exists()) {
        // If ID exists, generate a new one recursively
        return generateEventId(length);
    }
    
    return id;
}

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
    
    // Count total items (dishes)
    let itemCount = 0;
    let guestCount = 0;
    
    // Calculate total dish count and guest count from all RSVPs
    if (event.items) {
        Object.values(event.items).forEach(item => {
            // Count dishes (new format has an array of dishes)
            if (Array.isArray(item.dishes) && item.dishes.length > 0) {
                itemCount += item.dishes.length;
            } else {
                // Old format had a single dish
                itemCount += 1;
            }
            
            // Add guest count
            guestCount += item.guestCount || 1; // Default to 1 if not specified
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

// Count items by category - FIXED to count all dishes
function countItemsByCategory(items, category) {
    let count = 0;
    
    // Loop through all items (people)
    Object.values(items || {}).forEach(item => {
        // Handle both old and new formats
        if (Array.isArray(item.dishes) && item.dishes.length > 0) {
            // Count all dishes that match the category
            item.dishes.forEach(dish => {
                if (dish.category === category) {
                    count++;
                }
            });
        } else if (item.category === category) {
            // Old format - single dish
            count++;
        }
    });
    
    return count;
}

// Render Event List View - UPDATED for consistent container structure
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
        // No upcoming events message
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
    
    // Add Join Event button
    const joinEventBtn = document.createElement('button');
    joinEventBtn.className = 'floating-btn join-btn';
    joinEventBtn.innerHTML = `
        <i class="fas fa-sign-in-alt"></i>
        <span>Join an Event</span>
    `;
    joinEventBtn.addEventListener('click', showJoinEventModal);
    mainContent.appendChild(joinEventBtn);
    
    // Add floating Create Event button
    const createEventBtn = document.createElement('button');
    createEventBtn.className = 'floating-btn';
    createEventBtn.innerHTML = `
        <i class="fas fa-plus-circle"></i>
        <span>Create New Event</span>
    `;
    createEventBtn.addEventListener('click', showCreateEventModal);
    mainContent.appendChild(createEventBtn);
}

// Render Event Detail View - UPDATED for two-column layout with ad space and mobile reordering
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
    
    // Create the two-column layout container
    const eventPageLayout = document.createElement('div');
    eventPageLayout.className = 'event-page-layout';
    mainContent.appendChild(eventPageLayout);
    
    // Event Details Column
    const eventDetailsColumn = document.createElement('div');
    eventDetailsColumn.className = 'event-details-column';
    eventPageLayout.appendChild(eventDetailsColumn);
    
    // Ad Space Column - Moved to appear after items in mobile view via CSS
    const adSpaceColumn = document.createElement('div');
    adSpaceColumn.className = 'ad-space-column';
    adSpaceColumn.innerHTML = `
        <div class="ad-container">
            <!-- No advertisement header anymore -->
            <img src="assets/ads/ad-placeholder-300x250.svg" alt="Advertisement" class="ad-placeholder">
        </div>
    `;
    eventPageLayout.appendChild(adSpaceColumn);
    
    // Format date if needed
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
    
    // Event Details Panel
    const detailsPanel = document.createElement('div');
    detailsPanel.className = 'event-details-panel';
    
    // Add leave event button if user has joined but is not the host
    const isHost = currentUser && event.createdBy === currentUser.uid;
    const hasJoined = currentUser && !isHost; // Simplified check
    
    if (hasJoined) {
        const leaveButton = document.createElement('button');
        leaveButton.className = 'leave-event-btn';
        leaveButton.title = 'Leave Event';
        leaveButton.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        leaveButton.addEventListener('click', () => {
            showLeaveEventModal(event.id);
        });
        detailsPanel.appendChild(leaveButton);
    }
    
    // Add event details HTML
    detailsPanel.innerHTML += `
        <div class="event-details-header">
            <h3 class="event-detail-title">${event.name}</h3>
        </div>
        <div class="event-detail-row"><strong>Host:</strong> ${event.host}</div>
        <div class="event-detail-row"><strong>When:</strong> ${formattedDate}, ${event.time}</div>
        <div class="event-detail-row"><strong>Where:</strong> ${event.location}</div>
        ${event.description ? `<div class="event-detail-row">${event.description}</div>` : ''}
    `;
    
    eventDetailsColumn.appendChild(detailsPanel);
    
    // Create a new div for the items section with a specific class for mobile ordering
    const itemsSection = document.createElement('div');
    itemsSection.className = 'items-section';
    mainContent.appendChild(itemsSection);
    
    // Categories for filtering - Added "Other" category
    const categories = ['Appetizer', 'Main Dish', 'Side Dish', 'Dessert', 'Drink', 'Other'];
    
    // Create filter tabs
    const filterTabs = document.createElement('div');
    filterTabs.className = 'filter-tabs';
    
    filterTabs.innerHTML = `
        <span class="filter-label"><i class="fas fa-filter"></i> Filter:</span>
        <button class="filter-tab active" data-category="All">All</button>
    `;
    
    // Add category tabs with correct counts
    categories.forEach(category => {
        const count = countItemsByCategory(event.items || {}, category);
        const tab = document.createElement('button');
        tab.className = 'filter-tab';
        tab.setAttribute('data-category', category);
        tab.textContent = `${category} (${count})`;
        filterTabs.appendChild(tab);
    });
    
    itemsSection.appendChild(filterTabs);
    
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
    itemsSection.appendChild(itemsContainer);
    
    // Render items
    renderItemsList(event.items || {}, 'All');
    
    // Add floating RSVP button (only for non-past events)
    if (!isPastEvent) {
        const addItemBtn = document.createElement('button');
        // Allow hosts to RSVP multiple times (for non-users)
        const isDisabled = userHasRsvpd && !isHost;
        addItemBtn.className = `floating-btn ${isDisabled ? 'disabled' : ''}`;
        addItemBtn.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <span>RSVP</span>
        `;
        
        // If user has already RSVP'd and is not host, disable the button
        if (isDisabled) {
            addItemBtn.title = "You've already RSVP'd";
        } else {
            addItemBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showAddItemModal', { 
                    detail: { eventId: event.id }
                }));
            });
        }
        
        mainContent.appendChild(addItemBtn);
    }
    
    // Initialize ad space if ad system is loaded
    if (window.adSystem && typeof window.adSystem.initialize === 'function') {
        window.adSystem.initialize();
    }
    
    // Notify that event detail is rendered
    document.dispatchEvent(new Event('eventDetailRendered'));
}

// Filter items by category
function filterItems(category, event) {
    renderItemsList(event.items || {}, category);
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

// Event Modal Functions - Updated with public checkbox and placeholders
function showCreateEventModal() {
    if (!currentUser) {
        alert('Please sign in to create an event');
        document.dispatchEvent(new Event('showUserProfileModal'));
        return;
    }
    
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('save-event-btn');
    const deleteBtn = document.getElementById('delete-event-btn');
    
    // Reset the form
    form.reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-private').checked = false; // Default to public (unchecked is public)
    
    // Hide delete button for new events
    deleteBtn.style.display = 'none';
    
    // Pre-fill host name with current user's name
    if (currentUser) {
        document.getElementById('host-name').value = currentUser.name;
    }
    
    // Pre-fill date with today's date and set placeholder
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('event-date');
    dateInput.value = formattedDate;
    dateInput.placeholder = "Select a date";
    
    // Set time placeholder
    const timeInput = document.getElementById('event-time');
    timeInput.placeholder = "Select a time";
    
    // Set title and button text for create mode
    title.textContent = 'Create New Event';
    submitBtn.textContent = 'Create Event';
    
    // Show the modal
    modal.style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Notify that modal has been opened
    document.dispatchEvent(new CustomEvent('modalOpened', {
        detail: { modalId: 'event-modal' }
    }));
}

function showEditEventModal(event) {
    if (!currentUser) {
        alert('Please sign in to edit an event');
        document.dispatchEvent(new Event('showUserProfileModal'));
        return;
    }
    
    // Check if user is the host
    if (event.createdBy && event.createdBy !== currentUser.uid) {
        alert('Only the event host can edit event details');
        return;
    }
    
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('save-event-btn');
    const deleteBtn = document.getElementById('delete-event-btn');
    
    // Fill the form with event data
    document.getElementById('event-name').value = event.name;
    document.getElementById('host-name').value = event.host;
    
    // Format date to YYYY-MM-DD for the date input
    let formattedDate = '';
    if (event.date) {
        if (event.date.includes('/')) {
            // MM/DD/YYYY format
            const parts = event.date.split('/');
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
        } else {
            // Try to parse as date
            const dateParts = new Date(event.date);
            if (!isNaN(dateParts.getTime())) {
                formattedDate = dateParts.toISOString().split('T')[0];
            }
        }
    }
    document.getElementById('event-date').value = formattedDate;
    
    // Format time for the time input (convert from 12-hour to 24-hour format)
    let formattedTime = '';
    if (event.time) {
        const timeParts = event.time.match(/(\d+):(\d+) (AM|PM)/);
        if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = timeParts[2];
            const period = timeParts[3];
            
            // Convert to 24-hour format
            if (period === 'PM' && hours < 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            
            formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
    }
    document.getElementById('event-time').value = formattedTime;
    
    document.getElementById('event-location').value = event.location;
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-id').value = event.id;
    
    // Set private checkbox based on event data (default to false if not specified)
    document.getElementById('event-private').checked = event.isPublic === false;
    
    // Show delete button for own events
    deleteBtn.style.display = 'block';
    
    // Set title and button text for edit mode
    title.textContent = 'Edit Event';
    submitBtn.textContent = 'Save Changes';
    
    // Show the modal
    modal.style.display = 'block';
    
    // Notify that modal has been opened
    document.dispatchEvent(new CustomEvent('modalOpened', {
        detail: { modalId: 'event-modal' }
    }));
}

function hideEventModal() {
    const modal = document.getElementById('event-modal');
    modal.style.display = 'none';
}

// Updated for public/private change
async function handleEventFormSubmit() {
    if (!currentUser) {
        alert('You must be signed in to create or edit an event');
        return;
    }
    
    // Get form data
    const eventId = document.getElementById('event-id').value;
    const name = document.getElementById('event-name').value;
    const host = document.getElementById('host-name').value;
    const dateInput = document.getElementById('event-date').value;
    const timeInput = document.getElementById('event-time').value;
    const location = document.getElementById('event-location').value;
    const description = document.getElementById('event-description').value;
    const isPrivate = document.getElementById('event-private').checked;
    
    // Validate required fields
    if (!name || !host || !dateInput || !timeInput || !location) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Format date to MM/DD/YYYY
    let date = '';
    if (dateInput) {
        const dateObj = new Date(dateInput);
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = dateObj.getFullYear();
        date = `${month}/${day}/${year}`;
    }
    
    // Format time to 12-hour format
    let time = '';
    if (timeInput) {
        const timeObj = new Date(`2000-01-01T${timeInput}`);
        time = timeObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Prepare event data - NOTE: isPublic is now the opposite of isPrivate
    const eventData = {
        name,
        host,
        date,
        time,
        location,
        description,
        isPublic: !isPrivate, // Changed from isPublic to !isPrivate
        createdBy: currentUser.uid,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Create or update the event in Firebase
    if (eventId) {
        // Update existing event
        await updateEvent(eventId, eventData);
    } else {
        // Create new event
        await createEvent(eventData);
    }
    
    // Hide the modal
    hideEventModal();
}

// Create a new event with unique ID
async function createEvent(eventData) {
    try {
        // Generate a unique ID for the event
        const eventId = await generateEventId();
        
        // Get a reference to the events collection
        const eventRef = database.ref(`events/${eventId}`);
        
        // Save the event data
        await eventRef.set({
            ...eventData,
            items: {}
        });
        
        // Add this event to the user's hosted events
        await database.ref(`users/${currentUser.uid}/hostedEvents/${eventId}`).set(true);
        
        // Navigate to the new event
        document.dispatchEvent(new CustomEvent('navigateToDetail', { 
            detail: { eventId: eventId }
        }));
        
        return eventId;
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event. Please try again.');
    }
}

// Update an existing event
async function updateEvent(eventId, eventData) {
    try {
        // Check if user is the host
        const eventRef = database.ref(`events/${eventId}`);
        const snapshot = await eventRef.once('value');
        const currentEventData = snapshot.val();
        
        if (currentEventData && currentEventData.createdBy && currentEventData.createdBy !== currentUser.uid) {
            alert('Only the event host can edit event details');
            return;
        }
        
        // Update only the event details, not the items or createdBy/createdAt
        const updates = {
            name: eventData.name,
            host: eventData.host,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            description: eventData.description,
            isPublic: eventData.isPublic,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Update the event data
        await eventRef.update(updates);
        
        // Stay on the event detail page, it will update automatically
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event. Please try again.');
    }
}

// Share Modal Functionality - Updated with Calendar Export
function showShareModal(eventId) {
    const modal = document.getElementById('share-modal');
    const eventIdElement = document.getElementById('share-event-id');
    const eventUrlElement = document.getElementById('share-event-url');
    const exportCalendarBtn = document.getElementById('export-calendar-btn');
    
    // Check if the event is private and if current user is not the host
    const event = eventDetailData.event;
    const isHost = currentUser && event && event.createdBy === currentUser.uid;
    const isPrivate = event && event.isPublic === false;

    // If event is private and user is not host, show message instead
    if (isPrivate && !isHost) {
        alert('This is a private event. Sharing options are only available to the host.');
        return;
    }
    
    // Set event ID and URL
    const eventUrl = `${window.location.origin}${window.location.pathname}?id=${eventId}`;
    eventIdElement.textContent = eventId;
    eventUrlElement.textContent = eventUrl;
    
    // Add event listener for calendar export
    if (exportCalendarBtn) {
        // Remove previous listeners
        const newExportBtn = exportCalendarBtn.cloneNode(true);
        exportCalendarBtn.parentNode.replaceChild(newExportBtn, exportCalendarBtn);
        
        // Add event listener
        newExportBtn.addEventListener('click', function() {
            generateCalendarFile(eventDetailData.event);
        });
    }
    // Show the modal
    modal.style.display = 'block';
}

// Function to generate and download an ICS file
function generateCalendarFile(event) {
    // Ensure we have the event data
    if (!event || !event.name || !event.date || !event.time) {
        alert('Event information is incomplete. Cannot export to calendar.');
        return;
    }
    
    // Parse event date and time
    let startDate = new Date(event.date);
    
    // If date is in MM/DD/YYYY format, parse it
    if (event.date.includes('/')) {
        const parts = event.date.split('/');
        const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        startDate = new Date(year, month, day);
    }
    
    // Parse time (e.g., "7:00 PM")
    const timeMatch = event.time.match(/(\d+):(\d+) ([AP]M)/);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3];
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        startDate.setHours(hours, minutes, 0, 0);
    }
    
    // Set end time (default to 2 hours later)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    // Format dates for ICS
    function formatICSDate(date) {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    }
    
    // Create ICS content
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `SUMMARY:${event.name}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `LOCATION:${event.location}`,
        `DESCRIPTION:${event.description || 'Potluck event organized by ' + event.host}`,
        `ORGANIZER;CN=${event.host}:mailto:noreply@example.com`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    // Create and download the file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const fileName = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_calendar.ics`;
    
    // Create link and click it to download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showToast('Calendar event exported successfully!');
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

// Join event modal functions
function showJoinEventModal() {
    const modal = document.getElementById('join-event-modal');
    const form = document.getElementById('join-event-form');
    
    // Reset the form
    form.reset();
    
    // Show the modal
    modal.style.display = 'block';
}

function hideJoinEventModal() {
    const modal = document.getElementById('join-event-modal');
    modal.style.display = 'none';
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

// Set up event listeners for communication between files
document.addEventListener('renderEventList', function(e) {
    renderEventListView(e.detail.events);
});

document.addEventListener('renderEventDetail', function(e) {
    renderEventDetailView(e.detail.event);
});

document.addEventListener('showShareMessage', showShareMessage);
document.addEventListener('showEditEventModal', function(e) {
    showEditEventModal(e.detail.event);
});
document.addEventListener('hideEventModal', hideEventModal);
document.addEventListener('submitEventForm', handleEventFormSubmit);

// Calendar export functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for share and calendar export
    const exportCalendarBtn = document.getElementById('export-calendar-btn');
    if (exportCalendarBtn) {
        exportCalendarBtn.addEventListener('click', function() {
            if (eventDetailData.event) {
                generateCalendarFile(eventDetailData.event);
            } else {
                alert('Event data is not available. Please try again.');
            }
        });
    }
    
    // Copy buttons in share modal
    const copyIdBtn = document.getElementById('copy-id-btn');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const shareEmailBtn = document.getElementById('share-email-btn');
    const shareTextBtn = document.getElementById('share-text-btn');
    
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
});