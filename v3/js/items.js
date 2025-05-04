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
        : itemsArray.filter(item => {
            // Handle both old and new formats
            if (Array.isArray(item.dishes) && item.dishes.length > 0) {
                return item.dishes.some(dish => dish.category === filterCategory);
            } else {
                return item.category === filterCategory;
            }
        });
    
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
    
    // Get the guest count (default to 1 for backward compatibility)
    const guestCount = item.guestCount || 1;
    
    // Create HTML for dishes (if multiple)
    let dishesHtml = '';
    if (Array.isArray(item.dishes) && item.dishes.length > 0) {
        // Multiple dishes
        item.dishes.forEach(dish => {
            if (dish.name && dish.category) {
                dishesHtml += `
                    <span class="category-badge">${dish.category}</span>
                `;
            }
        });
    } else if (item.name && item.category) {
        // Single dish (old format)
        dishesHtml = `<span class="category-badge">${item.category}</span>`;
    }
    
    // Format the dish names with proper grammar
    let dishNameDisplay = '';
    if (Array.isArray(item.dishes) && item.dishes.length > 0) {
        // Get all valid dish names
        const dishNames = item.dishes
            .filter(d => d.name && d.name.trim() !== '')
            .map(d => d.name);
        
        // Format according to grammar rules
        if (dishNames.length === 0) {
            dishNameDisplay = 'No dish specified';
        } else if (dishNames.length === 1) {
            dishNameDisplay = dishNames[0];
        } else if (dishNames.length === 2) {
            dishNameDisplay = `${dishNames[0]} and ${dishNames[1]}`;
        } else {
            const lastDish = dishNames.pop();
            dishNameDisplay = `${dishNames.join(', ')}, and ${lastDish}`;
        }
    } else {
        // Old format or no dish specified
        dishNameDisplay = item.name || 'No dish specified';
    }
    
    card.innerHTML = `
        <div class="item-info">
            <h3>${item.person}: ${dishNameDisplay}</h3>
            <div class="item-badges">
                <span class="guest-count-badge"><i class="fas fa-users"></i> ${guestCount} guest${guestCount !== 1 ? 's' : ''}</span>
                ${dishesHtml}
            </div>
        </div>
        <div class="item-actions">
            ${!isEventPast(eventDetailData.event.date) ? `
                <button class="item-action-btn edit-btn" title="Edit Item">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="item-action-btn delete-btn" title="Remove Item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    // Add edit and delete event listeners if not a past event
    if (!isEventPast(eventDetailData.event.date)) {
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            showEditItemModal(item);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            showDeleteConfirmation(item.id);
        });
    }
    
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

// Add a dish template to the modal
function addDishTemplate(dishName = '', category = 'Main Dish', index = 0) {
    const dishesContainer = document.getElementById('dishes-container');
    const dishId = `dish-${index}`;
    
    const dishEntry = document.createElement('div');
    dishEntry.className = 'dish-entry';
    dishEntry.dataset.index = index;
    
    dishEntry.innerHTML = `
        <div class="dish-header">
            <h4>Dish ${index + 1}</h4>
            ${index > 0 ? `<button type="button" class="remove-dish-btn" data-index="${index}">
                <i class="fas fa-times-circle"></i>
            </button>` : ''}
        </div>
        <div class="form-group">
            <label for="${dishId}-name">Dish Name${index === 0 ? '' : ''}</label>
            <input type="text" id="${dishId}-name" class="dish-name" placeholder="What are you bringing?" value="${dishName}">
        </div>
        <div class="form-group">
            <label for="${dishId}-category">Category${index === 0 ? '' : ''}</label>
            <select id="${dishId}-category" class="dish-category">
                <option value="Appetizer" ${category === 'Appetizer' ? 'selected' : ''}>Appetizer</option>
                <option value="Main Dish" ${category === 'Main Dish' ? 'selected' : ''}>Main Dish</option>
                <option value="Side Dish" ${category === 'Side Dish' ? 'selected' : ''}>Side Dish</option>
                <option value="Dessert" ${category === 'Dessert' ? 'selected' : ''}>Dessert</option>
                <option value="Drink" ${category === 'Drink' ? 'selected' : ''}>Drink</option>
            </select>
        </div>
    `;
    
    dishesContainer.appendChild(dishEntry);
    
    // Add event listener to remove button
    if (index > 0) {
        const removeBtn = dishEntry.querySelector('.remove-dish-btn');
        removeBtn.addEventListener('click', function() {
            dishEntry.remove();
            // Renumber dishes
            reindexDishes();
        });
    }
}

// Reindex dishes after deletion
function reindexDishes() {
    const dishEntries = document.querySelectorAll('.dish-entry');
    dishEntries.forEach((entry, index) => {
        const header = entry.querySelector('h4');
        header.textContent = `Dish ${index + 1}`;
        entry.dataset.index = index;
        
        // Update remove button data-index if it exists
        const removeBtn = entry.querySelector('.remove-dish-btn');
        if (removeBtn) {
            removeBtn.dataset.index = index;
        }
    });
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
    
    // Clear dishes container
    const dishesContainer = document.getElementById('dishes-container');
    dishesContainer.innerHTML = '';
    
    // Add initial dish template
    addDishTemplate();
    
    // Add button for additional dishes - remove previous listeners
    const addDishBtn = document.getElementById('add-dish-btn');
    const newAddDishBtn = addDishBtn.cloneNode(true);
    addDishBtn.parentNode.replaceChild(newAddDishBtn, addDishBtn);
    
    // Add new listener
    newAddDishBtn.addEventListener('click', function() {
        const dishCount = document.querySelectorAll('.dish-entry').length;
        addDishTemplate('', 'Main Dish', dishCount);
    });
    
    // Set title and button text for add mode
    title.textContent = 'RSVP for Potluck';
    submitBtn.textContent = 'RSVP for Potluck';
    
    // Show the modal
    modal.style.display = 'block';
}

function showEditItemModal(item) {
    const modal = document.getElementById('item-modal');
    const form = document.getElementById('item-form');
    const title = document.getElementById('item-modal-title');
    const submitBtn = document.getElementById('save-item-btn');
    
    // Reset the form
    form.reset();
    
    // Fill the form with item data
    document.getElementById('person-name').value = item.person;
    document.getElementById('guest-count').value = item.guestCount || 1;
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-event-id').value = eventDetailData.event.id;
    
    // Clear dishes container
    const dishesContainer = document.getElementById('dishes-container');
    dishesContainer.innerHTML = '';
    
    // Add dishes
    if (Array.isArray(item.dishes) && item.dishes.length > 0) {
        // New format with multiple dishes
        item.dishes.forEach((dish, index) => {
            if (dish.name && dish.category) {
                addDishTemplate(dish.name, dish.category, index);
            }
        });
    } else if (item.name && item.category) {
        // Old format with single dish
        addDishTemplate(item.name, item.category, 0);
    } else {
        // No dishes yet
        addDishTemplate();
    }
    
    // Add button for additional dishes - remove previous listeners
    const addDishBtn = document.getElementById('add-dish-btn');
    const newAddDishBtn = addDishBtn.cloneNode(true);
    addDishBtn.parentNode.replaceChild(newAddDishBtn, addDishBtn);
    
    // Add new listener
    newAddDishBtn.addEventListener('click', function() {
        const dishCount = document.querySelectorAll('.dish-entry').length;
        addDishTemplate('', 'Main Dish', dishCount);
    });
    
    // Set title and button text for edit mode
    title.textContent = 'Edit RSVP';
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
    const person = document.getElementById('person-name').value;
    const guestCount = parseInt(document.getElementById('guest-count').value) || 1;
    
    // Collect dishes data
    const dishes = [];
    const dishEntries = document.querySelectorAll('.dish-entry');
    dishEntries.forEach(entry => {
        const nameInput = entry.querySelector('.dish-name');
        const categorySelect = entry.querySelector('.dish-category');
        if (nameInput && nameInput.value.trim()) {
            dishes.push({
                name: nameInput.value.trim(),
                category: categorySelect ? categorySelect.value : 'Main Dish'
            });
        }
    });
    
    // Validate required fields
    if (!person) {
        alert('Please enter your name.');
        return;
    }
    
    // Prepare item data - new format with dishes array and guest count
    const itemData = {
        person,
        guestCount,
        dishes
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