$(document).ready(function () {
    // Removed header load, now header is directly in home.html
    const url = 'http://localhost:4000/'
    const jwtToken = sessionStorage.getItem('jwtToken');
    // Fetch all items and display as cards
    $.ajax({
        url: `${url}api/v1/items`,
        method: 'GET',
        dataType: 'json',
        headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
        success: function (res) {
            let items = res.items || res.rows || res.data || [];
            if (!Array.isArray(items)) items = [];
            let html = '';
            if (items.length === 0) {
                html = '<div class="alert alert-info">No items found.</div>';
            } else {
                html = '<div class="row">';
                items.forEach(function (item) {
                    // If item.images is an array, show all images as a carousel, else fallback to image_path
                    let imagesHtml = '';
                    if (Array.isArray(item.images) && item.images.length > 0) {
                        let carouselId = 'carousel-' + item.item_id;
                        imagesHtml = `<div id='${carouselId}' class='carousel slide mb-2' data-ride='carousel'>`;
                        imagesHtml += `<div class='carousel-inner'>`;
                        item.images.forEach(function(img, idx) {
                            imagesHtml += `<div class='carousel-item${idx===0?' active':''}'>` +
                                `<img src='${url}${img}' class='d-block w-100' style='height:200px;object-fit:cover;' alt='${item.name} image ${idx+1}'>` +
                                `</div>`;
                        });
                        imagesHtml += `</div>`;
                        if (item.images.length > 1) {
                            imagesHtml += `
                                <a class='carousel-control-prev' href='#${carouselId}' role='button' data-slide='prev'>
                                    <span class='carousel-control-prev-icon' aria-hidden='true'></span>
                                    <span class='sr-only'>Previous</span>
                                </a>
                                <a class='carousel-control-next' href='#${carouselId}' role='button' data-slide='next'>
                                    <span class='carousel-control-next-icon' aria-hidden='true'></span>
                                    <span class='sr-only'>Next</span>
                                </a>
                            `;
                        }
                        imagesHtml += `</div>`;
                    } else if (item.image_path) {
                        imagesHtml = `<img src="${url}${item.image_path}" class="card-img-top" alt="${item.name}">`;
                    }
                    // Add quantity input and Add to Cart button
                    let cartControls = '';
                    if (item.quantity > 0) {
                        cartControls = `
                        <div class="input-group mb-2" style="max-width: 140px;">
                          <div class="input-group-prepend">
                            <button class="btn btn-outline-secondary btn-qty-down" type="button">&#8595;</button>
                          </div>
                          <input type="number" class="form-control qty-input no-spinner" min="1" max="${item.quantity}" value="1" style="text-align:center;" />
                          <div class="input-group-append">
                            <button class="btn btn-outline-secondary btn-qty-up" type="button">&#8593;</button>
                          </div>
                        </div>
                        <button class="btn btn-success btn-block btn-add-to-cart" data-id="${item.item_id}" data-name="${item.name}" data-price="${item.sell_price}" data-image="${(item.images && item.images[0]) ? url+item.images[0] : (item.image_path ? url+item.image_path : '')}" data-stock="${item.quantity}">
                          <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <style>
                          /* Hide number input spinners for all browsers */
                          input.qty-input.no-spinner::-webkit-outer-spin-button,
                          input.qty-input.no-spinner::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                          }
                          input.qty-input.no-spinner[type=number] {
                            -moz-appearance: textfield;
                          }
                        </style>
                        `;
                    } else {
                        cartControls = `<button class="btn btn-secondary btn-block" disabled>Out of Stock</button>`;
                    }
                    html += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            ${imagesHtml}
                            <div class="card-body">
                                <h5 class="card-title">${item.name}</h5>
                                <p class="card-text">${item.description}</p>
                                <p class="card-text"><strong>Category:</strong> ${item.category}</p>
                                <p class="card-text"><strong>Price:</strong> ₱${item.sell_price ?? ''}</p>
                                <p class="card-text"><strong>Stock:</strong> ${item.quantity ?? ''}</p>
                                <div class="cart-controls">${cartControls}</div>
                            </div>
                        </div>
                    </div>
                    `;
                });
                html += '</div>';
            }
            $('#itemCards').html(html);
        },
        error: function (err) {
            let msg = err.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : 'Failed to load items.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: msg
            }).then(() => {
                if (err.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
            $('#items').html('<div class="alert alert-danger">' + msg + '</div>');
        }
    });
    // Add event delegation for quantity up/down and add to cart
    $('#itemCards').off('click', '.btn-qty-up').on('click', '.btn-qty-up', function() {
        var $input = $(this).closest('.input-group').find('.qty-input');
        var max = parseInt($input.attr('max')) || 99;
        var val = parseInt($input.val()) || 1;
        if (val < max) $input.val(val + 1);
    });
    $('#itemCards').off('click', '.btn-qty-down').on('click', '.btn-qty-down', function() {
        var $input = $(this).closest('.input-group').find('.qty-input');
        var min = parseInt($input.attr('min')) || 1;
        var val = parseInt($input.val()) || 1;
        if (val > min) $input.val(val - 1);
    });
    $('#itemCards').off('input', '.qty-input').on('input', '.qty-input', function() {
        var $input = $(this);
        var min = parseInt($input.attr('min')) || 1;
        var max = parseInt($input.attr('max')) || 99;
        var val = parseInt($input.val()) || min;
        if (val < min) $input.val(min);
        if (val > max) $input.val(max);
    });
    $('#itemCards').off('click', '.btn-add-to-cart').on('click', '.btn-add-to-cart', function() {
        var $btn = $(this);
        var $card = $btn.closest('.card-body');
        var qty = parseInt($card.find('.qty-input').val()) || 1;
        var stock = parseInt($btn.data('stock'));
        if (qty > stock) qty = stock;
        if (qty < 1) qty = 1;
        var item = {
            item_id: $btn.data('id'),
            name: $btn.data('name'),
            price: parseFloat($btn.data('price')),
            sell_price: parseFloat($btn.data('price')),
            image: $btn.data('image'),
            description: $card.find('.card-text').first().text(),
            category: $card.find('.card-text strong:contains("Category:")').parent().text().replace('Category:', '').trim(),
            quantity: qty
        };
        if (typeof window.addToCart === 'function') {
            window.addToCart(item);
        } else {
            // fallback: store in localStorage
            let cart = localStorage.getItem('cart');
            cart = cart ? JSON.parse(cart) : [];
            let idx = cart.findIndex(i => i.item_id == item.item_id);
            if (idx > -1) {
                cart[idx].quantity += item.quantity;
            } else {
                cart.push(item);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            Swal.fire({
                icon: 'success',
                text: 'Item added to cart!'
            });
        }
    });
});