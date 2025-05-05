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

// Check if a date is past
function isEventPast(dateStr) {
    if (!dateStr) return false;
    
    // Try to extract date from string like "When: June 15, 2025, 6:00 PM - 9:00 PM"
    const datePart = dateStr.split(',')[0].trim();
    const date = new Date(datePart);
    
    // Create a date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return date < tomorrow;
}

// Create an item card element - MODIFIED for new layout
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
    
    // Check if event is past
    const eventDate = document.querySelector('.event-details-panel .event-detail-row:nth-child(3)');
    let isPastEvent = false;
    if (eventDate) {
        const dateText = eventDate.textContent.split(':')[1];
        isPastEvent = isEventPast(dateText);
    }
    
    // Check if notes or recipes exist
    const hasNotesOrRecipes = item.notes || item.recipes;
    
    // Check if current user can edit this item
    const canEdit = !isPastEvent && 
                    (currentUser && 
                    (item.userId === currentUser.uid || 
                     (eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid)));
    
    // Create HTML structure for the card - UPDATED LAYOUT
    card.innerHTML = `
        <div class="item-info">
            <h3>${dishNameDisplay}</h3>
            <div class="person-name">${item.person}</div>
            <div class="item-details">
                <span class="guest-count-badge"><i class="fas fa-users"></i> ${guestCount} guest${guestCount !== 1 ? 's' : ''}</span>
                ${dishesHtml}
            </div>
        </div>
        <div class="item-actions">
            ${hasNotesOrRecipes ? `
                <button class="item-action-btn notes-btn" title="View Notes & Recipe">
                    <i class="fas fa-sticky-note"></i>
                </button>
            ` : ''}
            ${canEdit ? `
                <button class="item-action-btn edit-btn" title="Edit Item">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="item-action-btn delete-btn" title="Remove Item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            ` : ''}
        </div>
        ${hasNotesOrRecipes ? `
            <div class="notes-content" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6;">
                ${item.notes ? `
                    <div class="notes-section">
                        <h4>Notes:</h4>
                        <p>${item.notes ? item.notes.split('\n').join('<br>') : ''}</p>
                    </div>
                ` : ''}
                ${item.recipes ? `
                    <div class="recipes-section">
                        <h4>Recipe:</h4>
                        <p>${item.recipes ? item.recipes.split('\n').join('<br>') : ''}</p>
                    </div>
                ` : ''}
            </div>
        ` : ''}
    `;
    
    // Add event listeners
    if (hasNotesOrRecipes) {
        const notesBtn = card.querySelector('.notes-btn');
        const notesContent = card.querySelector('.notes-content');
        
        notesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notesContent.style.display = notesContent.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    // Add edit and delete event listeners if allowed
    if (canEdit) {
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent('showEditItemModal', { 
                    detail: { item: item }
                }));
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent('showDeleteConfirmation', { 
                    detail: { itemId: item.id }
                }));
            });
        }
    }
    
    return card;
}

// Add a dish template to the modal - Updated with "Other" category
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
                <option value="Other" ${category === 'Other' ? 'selected' : ''}>Other</option>
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

// Function to set up optional field buttons
function setupOptionalFieldButtons() {
    // Notes button
    const addNotesBtn = document.getElementById('add-notes-btn');
    const newAddNotesBtn = addNotesBtn.cloneNode(true);
    addNotesBtn.parentNode.replaceChild(newAddNotesBtn, addNotesBtn);
    
    newAddNotesBtn.addEventListener('click', function() {
        document.getElementById('notes-container').style.display = 'block';
        this.style.display = 'none'; // Hide this button once clicked
    });
    
    // Recipes button
    const addRecipesBtn = document.getElementById('add-recipes-btn');
    const newAddRecipesBtn = addRecipesBtn.cloneNode(true);
    addRecipesBtn.parentNode.replaceChild(newAddRecipesBtn, addRecipesBtn);
    
    newAddRecipesBtn.addEventListener('click', function() {
        document.getElementById('recipes-container').style.display = 'block';
        this.style.display = 'none'; // Hide this button once clicked
    });
}

// Item Modal Functions - Modified to allow hosts to always RSVP
function showAddItemModal(eventId) {
    if (!currentUser) {
        alert('Please sign in to RSVP for an event');
        document.dispatchEvent(new Event('showUserProfileModal'));
        return;
    }
    
    // Check if user has already RSVP'd and is not the host
    const isHost = eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid;
    
    if (userHasRsvpd && !isHost) {
        alert('You have already RSVP\'d for this event. Please edit your existing RSVP.');
        return;
    }
    
    const modal = document.getElementById('item-modal');
    const form = document.getElementById('item-form');
    const title = document.getElementById('item-modal-title');
    const submitBtn = document.getElementById('save-item-btn');
    
    // Reset the form
    form.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-event-id').value = eventId;
    
    // Pre-fill person field with current user's name
    document.getElementById('person-name').value = currentUser.name;
    
    // Clear dishes container
    const dishesContainer = document.getElementById('dishes-container');
    dishesContainer.innerHTML = '';
    
    // Hide notes and recipes containers
    document.getElementById('notes-container').style.display = 'none';
    document.getElementById('recipes-container').style.display = 'none';
    
    // Show the optional buttons
    document.getElementById('add-notes-btn').style.display = 'flex';
    document.getElementById('add-recipes-btn').style.display = 'flex';
    
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
    
    // Add event listeners for notes and recipes buttons
    setupOptionalFieldButtons();
    
    // Set title and button text for add mode
    title.textContent = 'RSVP for Event';
    submitBtn.textContent = 'RSVP for Event';
    
    // Show the modal
    modal.style.display = 'block';
}

function showEditItemModal(item) {
    if (!currentUser) {
        alert('Please sign in to edit an RSVP');
        document.dispatchEvent(new Event('showUserProfileModal'));
        return;
    }
    
    // Check if user can edit this item
    const isHost = eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid;
    if (!isHost && item.userId && item.userId !== currentUser.uid) {
        alert('You can only edit your own RSVPs');
        return;
    }
    
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
    
    // Make sure we use the correct event ID
    // 1. Use the stored eventId from the item if available
    // 2. Or use window.currentEventId as a fallback from app.js
    // 3. Or check existing hidden field as last resort
    document.getElementById('item-event-id').value = item.eventId || window.currentEventId || document.getElementById('delete-event-id').value;
    
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
    
    // Handle notes and recipes
    const notesContainer = document.getElementById('notes-container');
    const recipesContainer = document.getElementById('recipes-container');
    
    // Set up notes
    if (item.notes) {
        document.getElementById('item-notes').value = item.notes;
        notesContainer.style.display = 'block';
        document.getElementById('add-notes-btn').style.display = 'none';
    } else {
        notesContainer.style.display = 'none';
        document.getElementById('add-notes-btn').style.display = 'flex';
    }
    
    // Set up recipes
    if (item.recipes) {
        document.getElementById('item-recipes').value = item.recipes;
        recipesContainer.style.display = 'block';
        document.getElementById('add-recipes-btn').style.display = 'none';
    } else {
        recipesContainer.style.display = 'none';
        document.getElementById('add-recipes-btn').style.display = 'flex';
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
    
    // Set up optional field buttons
    setupOptionalFieldButtons();
    
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

function handleItemFormSubmit() {
    if (!currentUser) {
        alert('You must be signed in to RSVP');
        return;
    }
    
    // Get form data
    const itemId = document.getElementById('item-id').value;
    const eventId = document.getElementById('item-event-id').value;
    const person = document.getElementById('person-name').value;
    const guestCount = parseInt(document.getElementById('guest-count').value) || 1;
    
    // Make sure we have an event ID
    let finalEventId = eventId;
    if (!finalEventId && window.currentEventId) {
        finalEventId = window.currentEventId;
    }
    
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
    
    // Get notes and recipes
    const notes = document.getElementById('item-notes').value.trim();
    const recipes = document.getElementById('item-recipes').value.trim();
    
    // Validate required fields
    if (!person) {
        alert('Please enter your name.');
        return;
    }
    
    // Prepare item data - new format with dishes array, guest count, notes, and recipes
    const itemData = {
        person,
        guestCount,
        dishes,
        userId: currentUser.uid // Add user ID to track ownership
    };
    
    // Add notes and recipes if they exist
    if (notes) {
        itemData.notes = notes;
    }
    
    if (recipes) {
        itemData.recipes = recipes;
    }
    
    // Add eventId to the item data
    itemData.eventId = finalEventId;
    
    // Create or update the item in Firebase
    if (itemId) {
        // Update existing item
        updateItem(finalEventId, itemId, itemData);
    } else {
        // Create new item
        createItem(finalEventId, itemData);
    }
    
    // Hide the modal
    hideItemModal();
    
    // Update RSVP status - don't update for hosts so they can add multiple RSVPs
    const isHost = eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid;
    if (!isHost) {
        userHasRsvpd = true;
    }
}

// Show Delete Confirmation
function showDeleteConfirmation(itemId) {
    if (!currentUser) {
        alert('Please sign in to remove items');
        document.dispatchEvent(new Event('showUserProfileModal'));
        return;
    }
    
    const modal = document.getElementById('confirm-modal');
    
    // Set the item ID to be deleted
    document.getElementById('delete-item-id').value = itemId;
    
    // Get the event ID from the current event
    if (eventDetailData.event && eventDetailData.event.id) {
        document.getElementById('delete-event-id').value = eventDetailData.event.id;
        
        // Check if user can delete this item
        const itemRef = database.ref(`events/${eventDetailData.event.id}/items/${itemId}`);
        itemRef.once('value', (snapshot) => {
            const item = snapshot.val();
            
            if (item) {
                const isHost = eventDetailData.event.createdBy === currentUser.uid;
                const isOwner = item.userId === currentUser.uid;
                
                if (isHost || isOwner) {
                    // Show the modal
                    modal.style.display = 'block';
                } else {
                    alert('You can only remove your own RSVPs');
                }
            } else {
                alert('Item not found.');
            }
        });
    } else {
        alert('Error: Could not determine which event this item belongs to.');
    }
}

function hideConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

function confirmDeleteItem() {
    if (!currentUser) {
        hideConfirmModal();
        return;
    }
    
    const itemId = document.getElementById('delete-item-id').value;
    const eventId = document.getElementById('delete-event-id').value;
    
    if (!itemId || !eventId) {
        hideConfirmModal();
        return;
    }
    
    // Get a reference to the item
    const itemRef = database.ref(`events/${eventId}/items/${itemId}`);
    
    // Check if user can delete this item
    itemRef.once('value', (snapshot) => {
        const item = snapshot.val();
        
        if (item) {
            const isHost = eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid;
            const isOwner = item.userId === currentUser.uid;
            
            if (isHost || isOwner) {
                // Delete the item
                itemRef.remove().then(() => {
                    // If this was the user's own RSVP, update the status
                    if (isOwner && !isHost) {
                        userHasRsvpd = false;
                    }
                    
                    // Item will be automatically removed from the UI due to the Firebase listener
                    hideConfirmModal();
                }).catch(error => {
                    console.error('Error deleting item:', error);
                    alert('Failed to delete item. Please try again.');
                    hideConfirmModal();
                });
            } else {
                alert('You can only remove your own RSVPs');
                hideConfirmModal();
            }
        } else {
            alert('Item not found.');
            hideConfirmModal();
        }
    });
}

// Create a new item
function createItem(eventId, itemData) {
    // Check for valid eventId
    if (!eventId) {
        console.error('No eventId provided when creating item');
        alert('Error: Could not determine which event to add this item to.');
        return;
    }
    
    // Get a reference to the items collection for this event
    const itemsRef = database.ref(`events/${eventId}/items`);
    const newItemRef = itemsRef.push();
    
    // Add timestamp
    itemData.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    // Save the item data
    newItemRef.set(itemData).then(() => {
        // Add this event to the user's joined events if not already joined
        if (currentUser) {
            const joinedRef = database.ref(`users/${currentUser.uid}/joinedEvents/${eventId}`);
            joinedRef.once('value', (snapshot) => {
                if (!snapshot.exists()) {
                    joinedRef.set(true);
                }
            });
        }
        
        // Set the current item ID for potential editing
        currentItemId = newItemRef.key;
        
        // Show a success message
        showToast('Successfully RSVP\'d for the event!');
    }).catch(error => {
        console.error('Error creating item:', error);
        alert('Failed to add item. Please try again.');
    });
}

// Update an existing item
function updateItem(eventId, itemId, itemData) {
    // Check for valid eventId and itemId
    if (!eventId || !itemId) {
        console.error('Missing eventId or itemId when updating item');
        alert('Error: Could not determine which item to update.');
        return;
    }
    
    // Get a reference to the specific item
    const itemRef = database.ref(`events/${eventId}/items/${itemId}`);
    
    // Check if user can update this item
    itemRef.once('value', (snapshot) => {
        const item = snapshot.val();
        
        if (item) {
            const isHost = eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid;
            const isOwner = item.userId === currentUser.uid;
            
            if (isHost || isOwner) {
                // Add updated timestamp
                itemData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
                
                // Update the item data
                itemRef.update(itemData).then(() => {
                    // Show success message
                    showToast('RSVP updated successfully!');
                }).catch(error => {
                    console.error('Error updating item:', error);
                    alert('Failed to update item. Please try again.');
                });
            } else {
                alert('You can only edit your own RSVPs');
            }
        } else {
            alert('Item not found.');
        }
    });
}

// Set up event listeners for communication between files
document.addEventListener('showAddItemModal', function(e) {
    showAddItemModal(e.detail.eventId);
});

document.addEventListener('showEditItemModal', function(e) {
    showEditItemModal(e.detail.item);
});

document.addEventListener('showDeleteConfirmation', function(e) {
    showDeleteConfirmation(e.detail.itemId);
});

document.addEventListener('hideItemModal', hideItemModal);
document.addEventListener('hideConfirmModal', hideConfirmModal);
document.addEventListener('confirmDelete', confirmDeleteItem);
document.addEventListener('submitItemForm', handleItemFormSubmit);

// Add a listener for renderItemsNeeded event (in case events.js tries to call renderItemsList before it's available)
document.addEventListener('renderItemsNeeded', function(e) {
    if (typeof renderItemsList === 'function') {
        renderItemsList(e.detail.items, e.detail.filterCategory);
    }
});