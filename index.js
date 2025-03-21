document.addEventListener('DOMContentLoaded', () => {
    const cartCount = document.getElementById('numb'); // Display for total cart count
    const cartContainer = document.querySelector('.main-wrapper .odd'); // Cart display container
    const cart = new Map(); // Use a Map for better key-value handling of cart items

    // Popup container setup
    const popup = createPopup();
    document.body.appendChild(popup);

    // Load cart data from localStorage
    loadCartFromLocalStorage();

    // Centralized event handling
    document.querySelector('.main-container').addEventListener('click', handleClickEvents);

    function createPopup() {
        const popup = document.createElement('div');
        popup.classList.add('popup-overlay');
        popup.innerHTML = `
            <div class="popup-content">
                <img src="images/icon-order-confirmed.svg" alt="">
                <h3>Order Confirmed!</h3>
                <p>We hope you enjoy your food.</p>
                <button class="close-popup">Start new order</button>
            </div>
        `;
        popup.style.display = 'none'; // Hide popup by default
        return popup;
    }

    function handleClickEvents(e) {
        // Handle increment only if the `ion-icon` within `.increment` is clicked
        if (e.target.tagName === 'ION-ICON' && e.target.closest('.increment')) {
            const controlsElement = e.target.closest('.controls');
            const itemName = controlsElement.dataset.itemName;
            return updateItemQuantity(itemName, 1, controlsElement);
        }

        // Handle decrement only if the `ion-icon` within `.decrement` is clicked
        if (e.target.tagName === 'ION-ICON' && e.target.closest('.decrement')) {
            const controlsElement = e.target.closest('.controls');
            const itemName = controlsElement.dataset.itemName;
            return updateItemQuantity(itemName, -1, controlsElement);
        }

        // Handle Add to Cart
        const button = e.target.closest('.clik');
        if (button && !e.target.classList.contains('increment') && !e.target.classList.contains('decrement')) {
            return handleAddToCart(button);
        }

        if (e.target.classList.contains('confirm')) return showPopup();
        if (e.target.classList.contains('close-popup')) return hidePopup();
    }

    function handleAddToCart(button) {
        // Deactivate all other buttons
        document.querySelectorAll('.clik').forEach(btn => {
            if (btn !== button) {
                btn.classList.remove('active'); // Remove 'active' state
                btn.style.backgroundColor = ''; // Reset background color
                btn.innerHTML = `
                    <img src="images/icon-add-to-cart.svg" alt="Add to Cart Icon">
                    <p>Add to Cart</p>
                `; // Reset to original "Add to Cart" button design
            }
        });

        // Activate the clicked button
        button.classList.add('active');
        button.style.backgroundColor = 'red';

        const itemElement = button.parentElement;
        const itemName = itemElement.querySelector('small')?.textContent;
        const itemPrice = parseFloat(itemElement.querySelector('h3')?.textContent.replace('$', ''));

        if (!itemName || isNaN(itemPrice)) {
            console.error("Invalid item data");
            return;
        }

        if (!cart.has(itemName)) {
            cart.set(itemName, { price: itemPrice, quantity: 1 });

            // Update button to show quantity controls
            button.innerHTML = `
                <div class="controls" data-item-name="${itemName}">
                    <div class="decrement"><ion-icon class="minus" name="remove-circle-outline"></ion-icon></div>
                    <div class="quantity">1</div>
                    <div class="increment"><ion-icon class="plus" name="add-circle-outline"></ion-icon></div>
                </div>
            `;
        }

        updateCartDisplay();
    }

    function updateItemQuantity(itemName, delta, controlsElement = null) {
        if (!cart.has(itemName)) return;

        const item = cart.get(itemName);
        item.quantity += delta;

        if (item.quantity <= 0) {
            cart.delete(itemName); // Remove from cart if quantity is zero or less
        } else {
            cart.set(itemName, item); // Update quantity

            // Update innerHTML of the .quantity div dynamically
            if (controlsElement) {
                const quantityElement = controlsElement.querySelector('.quantity');
                if (quantityElement) {
                    quantityElement.innerHTML = item.quantity; // Update quantity display
                }
            }
        }

        updateCartDisplay();
    }

    function updateCartDisplay() {
        let totalItems = 0;
        let totalCost = 0;
        const fragment = document.createDocumentFragment();

        cart.forEach((item, name) => {
            totalItems += item.quantity;
            totalCost += item.price * item.quantity;

            const cartItem = createCartItem(name, item);
            fragment.appendChild(cartItem);
        });

        cartContainer.innerHTML = '';
        cartContainer.appendChild(fragment);

        // Update cart count and totals
        cartCount.textContent = `(${totalItems})`;
        renderOrderSummary(totalCost);

        // Save updated cart to localStorage
        saveCartToLocalStorage();
    }

    function createCartItem(name, item) {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <div class="item-details">
                <p class="item-name">${name}</p>
                <div class="item-content">
                    <p class="item-info">
                        <span>${item.quantity}x</span> 
                        @ $${item.price.toFixed(2)} <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                    </p>
                    <img src="images/icon-remove-item.svg" alt="Remove Item" class="remove-item">
                </div> 
            </div>
        `;

        const removeBtn = cartItem.querySelector('.remove-item');
        removeBtn.addEventListener('click', () => {
            cart.delete(name); // Remove item
            updateCartDisplay(); // Refresh cart view
        });

        return cartItem;
    }

    function renderOrderSummary(totalCost) {
        cartContainer.querySelectorAll('.order-total').forEach(el => el.remove()); // Remove existing summary

        if (totalCost > 0) {
            const orderSummary = document.createElement('div');
            orderSummary.classList.add('order-total');
            orderSummary.innerHTML = `
                <div class="sub-content">
                    <h3><div class="text">Order Total</div> $${totalCost.toFixed(2)}</h3>
                    <div class="carbon"> 
                        <img src="images/icon-carbon-neutral.svg" alt="">
                        <div class="txt">This is a &nbsp;<em>carbon-neutral</em> &nbsp; delivery </div>
                    </div>
                    <button class="confirm">Confirm Order</button>
                </div>
            `;
            cartContainer.appendChild(orderSummary);
        } else {
            cartContainer.innerHTML = `
                <img src="images/illustration-empty-cart.svg" alt="">
                <h4>Your added items will appear here</h4>
            `;
        }
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('cart', JSON.stringify([...cart.entries()]));
    }

    function loadCartFromLocalStorage() {
        const storedCart = JSON.parse(localStorage.getItem('cart'));
        if (storedCart) {
            storedCart.forEach(([key, value]) => cart.set(key, value));
        }
        updateCartDisplay();
    }

    function showPopup() {
        popup.style.display = 'block';
        popup.classList.add('show');
    }

    function hidePopup() {
        popup.style.display = 'none';
        popup.classList.remove('show');
    }
});
