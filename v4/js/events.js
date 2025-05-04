// Event Management Functions

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
            <i class="fas fa-arrow-right view-details"></i>
        </div>
    `;
    
    // Prevent propagation on the "View Details" button to avoid double navigations
    const viewDetailsBtn = card.querySelector('.view-details');
    viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToEventDetail(event.id);
    });
    
    return card;
}