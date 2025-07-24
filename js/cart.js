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
        console.log('Cart contents:', cart); // Debug: Check cart contents
        let html = '';
        let total = 0;
        const shipping = 50.00;
        if (cart.length === 0) {
            html = `<div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Start shopping for amazing gadgets!</p>
                <a href="home.html" class="btn gadget-btn-primary mt-3">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </a>
            </div>`;
        } else {
            html = `<div class="table-responsive">
                <table class="table table-bordered">
                <thead>
                    <tr>
                        <th><i class="fas fa-image"></i> Image</th>
                        <th><i class="fas fa-tag"></i> Name</th>
                        <th><i class="fas fa-info-circle"></i> Description</th>
                        <th><i class="fas fa-list"></i> Category</th>
                        <th><i class="fas fa-peso-sign"></i> Price</th>
                        <th><i class="fas fa-sort-numeric-up"></i> Qty</th>
                        <th><i class="fas fa-calculator"></i> Total</th>
                        <th><i class="fas fa-trash"></i> Remove</th>
                    </tr>
                </thead>
                <tbody>`;
            cart.forEach((item, idx) => {
                console.log(`Cart item ${idx}:`, item); // Debug: Check individual items
                let price = item.sell_price !== undefined ? item.sell_price : item.price;
                let subtotal = price * item.quantity;
                total += subtotal;
                
                // Fix image URL to use correct backend server
                let imageUrl = item.image;
                if (imageUrl && !imageUrl.startsWith('http')) {
                    // If the image path doesn't start with http, prepend the backend URL
                    if (imageUrl.startsWith('/')) {
                        imageUrl = `${url}${imageUrl.substring(1)}`;
                    } else {
                        imageUrl = `${url}${imageUrl}`;
                    }
                }
                
                html += `<tr>
                    <td><img src="${imageUrl || `${url}storage/images/placeholder.png`}" width="60" alt="${item.name}" onerror="this.src='${url}storage/images/placeholder.png'"></td>
                    <td><strong>${item.name || ''}</strong></td>
                    <td>${item.description || ''}</td>
                    <td><span class="badge badge-info">${item.category || ''}</span></td>
                    <td><strong>₱${(price).toFixed(2)}</strong></td>
                    <td>
                        <div class="input-group input-group-sm" style="max-width: 110px; margin: 0 auto;">
                            <div class="input-group-prepend">
                                <button class="btn btn-cart-qty-down" type="button" data-idx="${idx}">
                                    <i class="fas fa-minus"></i>
                                </button>
                            </div>
                            <input type="number" class="form-control cart-qty-input no-spinner" min="1" value="${item.quantity}" data-idx="${idx}" />
                            <div class="input-group-append">
                                <button class="btn btn-cart-qty-up" type="button" data-idx="${idx}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </td>
                    <td><strong>₱${(subtotal).toFixed(2)}</strong></td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}" title="Remove item">
                        <i class="fas fa-times"></i>
                    </button></td>
                </tr>`;
            });
            html += `</tbody></table>
                </div>
                <div class="cart-total-section">
                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <h5 class="text-right">
                                <i class="fas fa-shopping-bag"></i> Items Total: 
                                <span class="text-primary">₱${total.toFixed(2)}</span>
                            </h5>
                            <h5 class="text-right">
                                <i class="fas fa-shipping-fast"></i> Shipping Fee: 
                                <span class="text-info">₱${shipping.toFixed(2)}</span>
                            </h5>
                            <h4 class="text-right">
                                <i class="fas fa-receipt"></i> Grand Total: 
                                <span>₱${(total + shipping).toFixed(2)}</span>
                            </h4>
                        </div>
                    </div>
                </div>
                <style>
                  input.cart-qty-input.no-spinner::-webkit-outer-spin-button,
                  input.cart-qty-input.no-spinner::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  input.cart-qty-input.no-spinner[type=number] {
                    -moz-appearance: textfield;
                  }
                  
                  /* Cart styling improvements */
                  .gadget-cart-container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px 0;
                  }
                  
                  .gadget-cart-title {
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    margin-bottom: 30px;
                  }
                  
                  .gadget-cart-table {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                  }
                  
                  .table th {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    font-weight: 600;
                  }
                  
                  .table td {
                    vertical-align: middle;
                    border-color: #e9ecef;
                  }
                  
                  .btn-cart-qty-up, .btn-cart-qty-down {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                  }
                  
                  .btn-cart-qty-up:hover, .btn-cart-qty-down:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                    color: white;
                  }
                  
                  .cart-total-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 20px;
                    border: 2px solid #667eea;
                  }
                  
                  .empty-cart-message {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                  }
                  
                  .empty-cart-message i {
                    font-size: 4rem;
                    color: #dee2e6;
                    margin-bottom: 20px;
                  }
                  
                  .cart-actions {
                    text-align: center;
                  }
                  
                  .gadget-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: 600;
                    color: white;
                    transition: all 0.3s ease;
                  }
                  
                  .gadget-btn-primary:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                    transform: translateY(-2px);
                    color: white;
                  }
                  
                  .gadget-btn-secondary {
                    background: transparent;
                    border: 2px solid white;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: 600;
                    margin-right: 15px;
                    transition: all 0.3s ease;
                  }
                  
                  .gadget-btn-secondary:hover {
                    background: white;
                    color: #667eea;
                    text-decoration: none;
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
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
        
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
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
    });

    $('#header').load("header.html", function() {
        if (!sessionStorage.getItem('userId')) {
            // Hide Profile menu if not logged in
            $('a.nav-link[href="profile.html"]').closest('.nav-item').hide();
            // Show Register and Login
            $('a.nav-link[href="register.html"]').closest('.nav-item').show();
            $('a.nav-link[href="login.html"]').closest('.nav-item').show();
        } else {
            // If logged in, show Profile, hide Register, change Login to Logout
            $('a.nav-link[href="profile.html"]').closest('.nav-item').show();
            $('a.nav-link[href="register.html"]').closest('.nav-item').hide();
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    });

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
                
                // Update cart badge after successful checkout
                if (typeof window.updateCartBadge === 'function') {
                    window.updateCartBadge();
                }
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
            
            // Update cart badge
            if (typeof window.updateCartBadge === 'function') {
                window.updateCartBadge();
            }
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
            
            // Update cart badge
            if (typeof window.updateCartBadge === 'function') {
                window.updateCartBadge();
            }
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
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
    });

    renderCart();
});