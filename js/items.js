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

// Create an item card element with improved RSVP card layout
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.setAttribute('data-id', item.id);
    
    // Get the guest count (default to 1 for backward compatibility)
    const guestCount = item.guestCount || 1;
    
    // Check if event is past
    const eventDate = document.querySelector('.event-details-panel .event-detail-row:nth-child(3)');
    let isPastEvent = false;
    if (eventDate) {
        const dateText = eventDate.textContent.split(':')[1];
        isPastEvent = isEventPast(dateText);
    }
    
    // Check if current user can edit this item
    const canEdit = !isPastEvent && 
                    (currentUser && 
                    (item.userId === currentUser.uid || 
                     (eventDetailData.event && eventDetailData.event.createdBy === currentUser.uid)));
    
    // Build the card header with user photo, name and guest count on one line
    let cardHTML = `
        <div class="rsvp-header">
            <img src="${item.photoURL || 'assets/default-avatar.png'}" alt="User" class="rsvp-user-photo">
            <div class="rsvp-user-info">
                <div class="rsvp-user-name">
                    ${item.person}
                    <span class="rsvp-guest-badge">
                        <i class="fas fa-users"></i> ${guestCount} guest${guestCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div class="item-actions">
                ${item.notes ? `
                    <button class="item-action-btn notes-btn" title="View Notes">
                        <i class="fas fa-file-alt"></i>
                    </button>
                ` : ''}
                ${canEdit ? `
                    <button class="item-action-btn edit-btn" title="Edit RSVP">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="item-action-btn delete-btn" title="Remove RSVP">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add dishes - each on their own line with recipe icon if applicable
    if (Array.isArray(item.dishes) && item.dishes.length > 0) {
        // Multiple dishes in new format
        item.dishes.forEach((dish, index) => {
            if (dish.name && dish.category) {
                cardHTML += `
                    <div class="rsvp-item" data-dish-index="${index}">
                        <i class="fas fa-square-check rsvp-item-icon"></i>
                        <div class="rsvp-item-name">${dish.name}</div>
                        <span class="category-badge category-${dish.category.replace(/\s+/g, '-').toLowerCase()}" data-category="${dish.category}">${dish.category}</span>
                        ${dish.recipe ? `
                            <i class="fas fa-file-signature recipe-icon" title="View Recipe"></i>
                        ` : ''}
                    </div>
                    ${dish.recipe ? `
                        <div class="recipe-content" data-dish-index="${index}" style="display: none;">
                            <div class="recipes-section">
                                <h4><i class="fas fa-file-signature"></i> Recipe:</h4>
                                <p>${dish.recipe.split('\n').join('<br>')}</p>
                            </div>
                        </div>
                    ` : ''}
                `;
            }
        });
    } else if (item.name && item.category) {
        // Single dish (old format)
        cardHTML += `
            <div class="rsvp-item" data-dish-index="0">
                <i class="fas fa-square-check rsvp-item-icon"></i>
                <div class="rsvp-item-name">${item.name}</div>
                <span class="category-badge category-${item.category.replace(/\s+/g, '-').toLowerCase()}" data-category="${item.category}">${item.category}</span>
                ${item.recipes ? `
                    <i class="fas fa-file-signature recipe-icon" title="View Recipe"></i>
                ` : ''}
            </div>
            ${item.recipes ? `
                <div class="recipe-content" data-dish-index="0" style="display: none;">
                    <div class="recipes-section">
                        <h4><i class="fas fa-file-signature"></i> Recipe:</h4>
                        <p>${item.recipes.split('\n').join('<br>')}</p>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    // Notes section (if present)
    if (item.notes) {
        cardHTML += `
            <div class="notes-content" style="display: none;">
                <div class="notes-section">
                    <h4><i class="fas fa-file-alt"></i> Notes:</h4>
                    <p>${item.notes.split('\n').join('<br>')}</p>
                </div>
            </div>
        `;
    }
    
    // Set the card HTML
    card.innerHTML = cardHTML;
    
    // Add event listeners for notes, recipe and category tags
    
    // Notes toggle
    if (item.notes) {
        const notesBtn = card.querySelector('.notes-btn');
        const notesContent = card.querySelector('.notes-content');
        
        notesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notesContent.style.display = notesContent.style.display === 'none' ? 'block' : 'none';
            
            // Update icon color to show active state
            if (notesContent.style.display === 'block') {
                notesBtn.querySelector('i').style.color = '#4f46e5';
            } else {
                notesBtn.querySelector('i').style.color = '#9ca3af';
            }
        });
    }
    
    // Recipe toggles
    const recipeIcons = card.querySelectorAll('.recipe-icon');
    recipeIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const dishItem = icon.closest('.rsvp-item');
            const dishIndex = dishItem.getAttribute('data-dish-index');
            const recipeContent = card.querySelector(`.recipe-content[data-dish-index="${dishIndex}"]`);
            
            if (recipeContent) {
                recipeContent.style.display = recipeContent.style.display === 'none' ? 'block' : 'none';
                
                // Update icon color to show active state
                if (recipeContent.style.display === 'block') {
                    icon.style.color = '#4f46e5';
                } else {
                    icon.style.color = '';
                }
            }
        });
    });
    
    // Category tag click for filtering
    const categoryTags = card.querySelectorAll('.category-badge');
    categoryTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = tag.getAttribute('data-category');
            
            // Find and click the corresponding filter tab
            const filterTabs = document.querySelectorAll('.filter-tab');
            filterTabs.forEach(tab => {
                if (tab.getAttribute('data-category') === category) {
                    tab.click();
                }
            });
        });
    });
    
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

// Add a dish template to the modal - Updated with recipe field
function addDishTemplate(dishName = '', category = 'Main Dish', recipe = '', index = 0) {
    const dishesContainer = document.getElementById('dishes-container');
    const dishId = `dish-${index}`;
    
    const dishEntry = document.createElement('div');
    dishEntry.className = 'dish-container';
    dishEntry.dataset.index = index;
    
    dishEntry.innerHTML = `
        <div class="dish-header">
            <h4>Item/Dish ${index + 1}</h4>
            ${index > 0 ? `<button type="button" class="remove-dish-btn" data-index="${index}">
                <i class="fas fa-times-circle"></i>
            </button>` : ''}
        </div>
        <div class="form-group">
            <label for="${dishId}-name">Name${index === 0 ? '*' : '*'}</label>
            <input type="text" id="${dishId}-name" class="dish-name" placeholder="What are you bringing?" value="${dishName}" required>
        </div>
        <div class="form-group">
            <label for="${dishId}-category">Category${index === 0 ? '*' : '*'}</label>
            <select id="${dishId}-category" class="dish-category">
                <option value="Appetizer" ${category === 'Appetizer' ? 'selected' : ''}>Appetizer</option>
                <option value="Main Dish" ${category === 'Main Dish' ? 'selected' : ''}>Main Dish</option>
                <option value="Side Dish" ${category === 'Side Dish' ? 'selected' : ''}>Side Dish</option>
                <option value="Dessert" ${category === 'Dessert' ? 'selected' : ''}>Dessert</option>
                <option value="Drink" ${category === 'Drink' ? 'selected' : ''}>Drink</option>
                <option value="Other" ${category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
        </div>
        <div class="form-group">
            <label for="${dishId}-recipe">Recipe (Optional)</label>
            <textarea id="${dishId}-recipe" class="dish-recipe" placeholder="Share your recipe..." rows="3">${recipe}</textarea>
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
    const dishEntries = document.querySelectorAll('.dish-container');
    dishEntries.forEach((entry, index) => {
        const header = entry.querySelector('h4');
        header.textContent = `Item/Dish ${index + 1}`;
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
}

// Item Modal Functions - Modified for starting with no dishes
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
    
    // Clear dishes container - start with no dishes
    const dishesContainer = document.getElementById('dishes-container');
    dishesContainer.innerHTML = '';
    
    // Hide notes container
    document.getElementById('notes-container').style.display = 'none';
    
    // Show the optional buttons
    document.getElementById('add-notes-btn').style.display = 'flex';
    
    // Add button for dishes - remove previous listeners
    const addDishBtn = document.getElementById('add-dish-btn');
    const newAddDishBtn = addDishBtn.cloneNode(true);
    addDishBtn.parentNode.replaceChild(newAddDishBtn, addDishBtn);
    
    // Add new listener - always keep the same button text
    newAddDishBtn.addEventListener('click', function() {
        const dishCount = document.querySelectorAll('.dish-container').length;
        addDishTemplate('', 'Main Dish', '', dishCount);
    });
    
    // Add event listeners for notes button
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
    document.getElementById('item-event-id').value = item.eventId || window.currentEventId || document.getElementById('delete-event-id').value;
    
    // Clear dishes container
    const dishesContainer = document.getElementById('dishes-container');
    dishesContainer.innerHTML = '';
    
    // Add dishes
    if (Array.isArray(item.dishes) && item.dishes.length > 0) {
        // New format with multiple dishes
        item.dishes.forEach((dish, index) => {
            if (dish.name && dish.category) {
                addDishTemplate(dish.name, dish.category, dish.recipe || '', index);
            }
        });
    } else if (item.name && item.category) {
        // Old format with single dish
        addDishTemplate(item.name, item.category, item.recipes || '', 0);
    }
    
    // Handle notes
    const notesContainer = document.getElementById('notes-container');
    
    // Set up notes
    if (item.notes) {
        document.getElementById('item-notes').value = item.notes;
        notesContainer.style.display = 'block';
        document.getElementById('add-notes-btn').style.display = 'none';
    } else {
        notesContainer.style.display = 'none';
        document.getElementById('add-notes-btn').style.display = 'flex';
    }
    
    // Add button for additional dishes - remove previous listeners
    const addDishBtn = document.getElementById('add-dish-btn');
    const newAddDishBtn = addDishBtn.cloneNode(true);
    addDishBtn.parentNode.replaceChild(newAddDishBtn, addDishBtn);
    
    // Add new listener with consistent text
    newAddDishBtn.addEventListener('click', function() {
        const dishCount = document.querySelectorAll('.dish-container').length;
        addDishTemplate('', 'Main Dish', '', dishCount);
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

// Updated handleItemFormSubmit function for new dish structure
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
    const dishEntries = document.querySelectorAll('.dish-container');
    dishEntries.forEach(entry => {
        const nameInput = entry.querySelector('.dish-name');
        const categorySelect = entry.querySelector('.dish-category');
        const recipeTextarea = entry.querySelector('.dish-recipe');
        
        if (nameInput && nameInput.value.trim()) {
            dishes.push({
                name: nameInput.value.trim(),
                category: categorySelect ? categorySelect.value : 'Main Dish',
                recipe: recipeTextarea ? recipeTextarea.value.trim() : ''
            });
        }
    });
    
    // Get notes
    const notes = document.getElementById('item-notes') ? document.getElementById('item-notes').value.trim() : '';
    
    // Validate required fields
    if (!person) {
        alert('Please enter your name.');
        return;
    }
    
    // Require at least one dish
    if (dishes.length === 0) {
        alert('Please add at least one item or dish.');
        return;
    }
    
    // Prepare item data - new format with dishes array and attached recipes
    const itemData = {
        person,
        guestCount,
        dishes,
        userId: currentUser.uid, // Add user ID to track ownership
        photoURL: currentUser.photoURL // Add user photo URL for the RSVP card
    };
    
    // Add notes if they exist
    if (notes) {
        itemData.notes = notes;
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