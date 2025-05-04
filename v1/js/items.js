// Items Management Functions

// Render the items list
function renderItemsList(items = {}, filterCategory = 'All') {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;
    
    itemsContainer.innerHTML = '';
    
    // Convert items object to array for easier manipulation
    const itemsArray = Object.entries(items).map(([id, item]) => {
        return { id, ...item };
    });
    
    // Filter items by category if needed
    const filteredItems = filterCategory === 'All' 
        ? itemsArray 
        : itemsArray.filter(item => item.category === filterCategory);
    
    if (filteredItems.length === 0) {
        // No items message
        const noItems = document.createElement('div');
        noItems.className = 'no-items';
        noItems.textContent = 'No items in this category yet. Add the first one!';
        itemsContainer.appendChild(noItems);
        return;
    }
    
    // Render each item
    filteredItems.forEach(item => {
        const itemCard = createItemCard(item);
        itemsContainer.appendChild(itemCard);
    });
}

// Create an item card element
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.setAttribute('data-id', item.id);
    
    // Dietary badges
    const dietaryBadges = Array.isArray(item.dietary) && item.dietary.length > 0
        ? item.dietary.map(diet => `<span class="dietary-badge">${diet}</span>`).join('')
        : '';
    
    card.innerHTML = `
        <div class="item-info">
            <h3>${item.name}</h3>
            <p class="item-person">Brought by: ${item.person}</p>
            <div class="item-badges">
                <span class="category-badge">${item.category}</span>
                ${dietaryBadges}
            </div>
        </div>
        <div class="item-actions">
            ${!isEventPast(eventDetailData.event.date) ? `
                <button class="item-action-btn edit-btn" title="Edit Item">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="item-action-btn delete-btn" title="Remove Item">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    // Add edit and delete event listeners if not a past event
    if (!isEventPast(eventDetailData.event.date)) {
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => {
            showEditItemModal(item);
        });
        
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation(item.id);
        });
    }
    
    return card;
}

// Item Modal Functions
function showAddItemModal(eventId) {
    const modal = document.getElementById('item-modal');
    const form = document.getElementById('item-form');
    const title = document.getElementById('item-modal-title');
    const submitBtn = document.getElementById('save-item-btn');
    
    // Reset the form
    form.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-event-id').value = eventId;
    
    // Uncheck all dietary checkboxes
    const checkboxes = document.querySelectorAll('#dietary-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Set title and button text for add mode
    title.textContent = 'Add Your Dish';
    submitBtn.textContent = 'Add to Potluck';
    
    // Show the modal
    modal.style.display = 'block';
}

function showEditItemModal(item) {
    const modal = document.getElementById('item-modal');
    const form = document.getElementById('item-form');
    const title = document.getElementById('item-modal-title');
    const submitBtn = document.getElementById('save-item-btn');
    
    // Fill the form with item data
    document.getElementById('dish-name').value = item.name;
    document.getElementById('person-name').value = item.person;
    document.getElementById('category').value = item.category;
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-event-id').value = eventDetailData.event.id;
    
    // Check appropriate dietary checkboxes
    const checkboxes = document.querySelectorAll('#dietary-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = Array.isArray(item.dietary) && item.dietary.includes(checkbox.value);
    });
    
    // Set title and button text for edit mode
    title.textContent = 'Edit Dish';
    submitBtn.textContent = 'Save Changes';
    
    // Show the modal
    modal.style.display = 'block';
}

function hideItemModal() {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'none';
}

function handleItemFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const itemId = document.getElementById('item-id').value;
    const eventId = document.getElementById('item-event-id').value;
    const name = document.getElementById('dish-name').value;
    const person = document.getElementById('person-name').value;
    const category = document.getElementById('category').value;
    
    // Get selected dietary options
    const dietary = [];
    const checkboxes = document.querySelectorAll('#dietary-options input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        dietary.push(checkbox.value);
    });
    
    // Validate required fields
    if (!name || !person || !category) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Prepare item data
    const itemData = {
        name,
        person,
        category,
        dietary
    };
    
    // Create or update the item in Firebase
    if (itemId) {
        // Update existing item
        updateItem(eventId, itemId, itemData);
    } else {
        // Create new item
        createItem(eventId, itemData);
    }
    
    // Hide the modal
    hideItemModal();
}

// Create a new item
function createItem(eventId, itemData) {
    // Get a reference to the items collection for this event
    const itemsRef = database.ref(`events/${eventId}/items`);
    const newItemRef = itemsRef.push();
    
    // Save the item data
    newItemRef.set(itemData).catch(error => {
        console.error('Error creating item:', error);
        alert('Failed to add item. Please try again.');
    });
}

// Update an existing item
function updateItem(eventId, itemId, itemData) {
    // Get a reference to the specific item
    const itemRef = database.ref(`events/${eventId}/items/${itemId}`);
    
    // Update the item data
    itemRef.update(itemData).catch(error => {
        console.error('Error updating item:', error);
        alert('Failed to update item. Please try again.');
    });
}

// Delete Confirmation
function showDeleteConfirmation(itemId) {
    const modal = document.getElementById('confirm-modal');
    
    // Set the item ID to be deleted
    document.getElementById('delete-item-id').value = itemId;
    document.getElementById('delete-event-id').value = eventDetailData.event.id;
    
    // Show the modal
    modal.style.display = 'block';
}

function hideConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

function confirmDeleteItem() {
    const itemId = document.getElementById('delete-item-id').value;
    const eventId = document.getElementById('delete-event-id').value;
    
    if (!itemId || !eventId) {
        hideConfirmModal();
        return;
    }
    
    // Get a reference to the item and delete it
    const itemRef = database.ref(`events/${eventId}/items/${itemId}`);
    
    itemRef.remove().then(() => {
        // Item will be automatically removed from the UI due to the Firebase listener
        hideConfirmModal();
    }).catch(error => {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
        hideConfirmModal();
    });
}