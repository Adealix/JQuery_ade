$(document).ready(function () {
    const url = 'http://localhost:4000/'
    // Use localStorage for persistent cart, or switch to sessionStorage for session-only cart
    function getCart() {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function renderCart() {
        let cart = getCart();
        let html = '';
        let total = 0;
        const shipping = 50.00;
        if (cart.length === 0) {
            html = '<p>Your cart is empty.</p>';
        } else {
            html = `<table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total Price</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>`;
            cart.forEach((item, idx) => {
                let price = item.sell_price !== undefined ? item.sell_price : item.price;
                let subtotal = price * item.quantity;
                total += subtotal;
                html += `<tr>
                    <td><img src="${item.image}" width="60"></td>
                    <td>${item.name || ''}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.category || ''}</td>
                    <td>₱ ${(price).toFixed(2)}</td>
                    <td>
                        <div class="input-group input-group-sm" style="max-width: 110px;">
                            <div class="input-group-prepend">
                                <button class="btn btn-outline-secondary btn-cart-qty-down" type="button" data-idx="${idx}">&#8595;</button>
                            </div>
                            <input type="number" class="form-control cart-qty-input no-spinner" min="1" value="${item.quantity}" data-idx="${idx}" style="text-align:center;" />
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary btn-cart-qty-up" type="button" data-idx="${idx}">&#8593;</button>
                            </div>
                        </div>
                    </td>
                    <td>₱ ${(subtotal).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}">&times;</button></td>
                </tr>`;
            });
            html += `</tbody></table>
                <h5 class="text-right">Total (Items Only): ₱ ${total.toFixed(2)}</h5>
                <h5 class="text-right">Shipping Fee: ₱ ${shipping.toFixed(2)}</h5>
                <h4 class="text-right">Grand Total: ₱ ${(total + shipping).toFixed(2)}</h4>
                <style>
                  input.cart-qty-input.no-spinner::-webkit-outer-spin-button,
                  input.cart-qty-input.no-spinner::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  input.cart-qty-input.no-spinner[type=number] {
                    -moz-appearance: textfield;
                  }
                </style>`;
        }
        $('#cartTable').html(html);
    }

    // Add to cart logic (should be called from product/item page)
    window.addToCart = function(item) {
        let cart = getCart();
        // Check if item already exists in cart
        let idx = cart.findIndex(i => i.item_id === item.item_id);
        if (idx > -1) {
            cart[idx].quantity += item.quantity;
        } else {
            cart.push(item);
        }
        saveCart(cart);
        renderCart();
        Swal.fire({
            icon: 'success',
            text: 'Item added to cart!'
        });
    }

    $('#cartTable').on('click', '.remove-item', function () {
        let idx = $(this).data('idx');
        let cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
    });

    $('#header').load("header.html");

    function getUserId() {
        let userId = sessionStorage.getItem('userId');
        return userId ? JSON.parse(userId) : '';
    }
    function getJwtToken() {
        return sessionStorage.getItem('jwtToken') || '';
    }

    $('#checkoutBtn').on('click', function () {
        let cart = getCart();
        if (!getUserId()) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to checkout.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }
        if (cart.length === 0) {
            Swal.fire({
                icon: 'info',
                text: 'Your cart is empty.'
            });
            return;
        }
        const payload = JSON.stringify({
            user: { id: getUserId() },
            cart
        });
        $.ajax({
            type: "POST",
            url: `${url}api/v1/create-order`,
            data: payload,
            dataType: "json",
            processData: false,
            contentType: 'application/json; charset=utf-8',
            headers: getJwtToken() ? { 'Authorization': 'Bearer ' + getJwtToken() } : {},
            success: function (data) {
                Swal.fire({
                    icon: "success",
                    text: data.message,
                });
                localStorage.removeItem('cart');
                renderCart();
            },
            error: function (error) {
                let msg = 'An error occurred.';
                if (error.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (error.status === 403) {
                    msg = '403 Forbidden: You are not allowed to perform this action.';
                } else if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Checkout Failed',
                    text: msg
                }).then(() => {
                    if (error.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    });

    // Quantity up/down and input change handlers for cart
    $('#cartTable').off('click', '.btn-cart-qty-up').on('click', '.btn-cart-qty-up', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let max = 99; // Optionally set a max stock limit
        if (cart[idx].quantity < max) {
            cart[idx].quantity++;
            saveCart(cart);
            renderCart();
        }
    });
    $('#cartTable').off('click', '.btn-cart-qty-down').on('click', '.btn-cart-qty-down', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let min = 1;
        if (cart[idx].quantity > min) {
            cart[idx].quantity--;
            saveCart(cart);
            renderCart();
        }
    });
    $('#cartTable').off('input', '.cart-qty-input').on('input', '.cart-qty-input', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let min = 1;
        let val = parseInt($(this).val()) || min;
        if (val < min) val = min;
        cart[idx].quantity = val;
        saveCart(cart);
        renderCart();
    });

    renderCart();
});