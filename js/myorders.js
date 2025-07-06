$(document).ready(function () {
    $('#header').load('header.html');
    const url = 'http://localhost:4000/';
    const userId = sessionStorage.getItem('userId') ? JSON.parse(sessionStorage.getItem('userId')) : '';
    const jwtToken = sessionStorage.getItem('jwtToken') || '';
    if (!userId || !jwtToken) {
        Swal.fire({
            icon: 'warning',
            text: 'You must be logged in to view your orders.'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    $.ajax({
        url: `${url}api/v1/orders/user/${userId}`,
        method: 'GET',
        dataType: 'json',
        headers: { 'Authorization': 'Bearer ' + jwtToken },
        success: function (res) {
            if (!res.orders || res.orders.length === 0) {
                $('#ordersContainer').html('<div class="alert alert-info">No orders found.</div>');
                return;
            }
            let html = '';
            res.orders.forEach(function(order, orderIdx) {
                // Fallbacks for customer info
                const lastName = order.last_name || '';
                const firstName = order.first_name || '';
                const address = order.address || '';
                const city = order.city || '';
                const phone = order.phone || '';
                const shipping = order.shipping !== undefined ? Number(order.shipping) : 50.00;
                html += `<div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <strong>Order #${order.order_id}</strong> - ${order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : ''}
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h5>Customer Info</h5>
                                <p><strong>Name:</strong> ${lastName}, ${firstName}</p>
                                <p><strong>Address:</strong> ${address}${city ? ', ' + city : ''}</p>
                                <p><strong>Phone:</strong> ${phone}</p>
                            </div>
                            <div class="col-md-6">
                                <h5>Order Details</h5>
                                <p><strong>Status:</strong> ${order.status || ''}</p>
                            </div>
                        </div>
                        <div class="table-responsive mt-3">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Images</th>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                let total = 0;
                (order.items || []).forEach(function(item, itemIdx) {
                    let price = Number(item.sell_price !== undefined ? item.sell_price : item.price) || 0;
                    let subtotal = price * (item.quantity || 1);
                    total += subtotal;
                    // Show all images as thumbnails (or placeholder if none)
                    let imagesHtml = '';
                    if (Array.isArray(item.images) && item.images.length > 0) {
                        imagesHtml = item.images.map(imgPath => `<img src='${url}${imgPath}' width='40' height='40' style='object-fit:cover;margin-right:2px;border-radius:4px;' />`).join('');
                    } else {
                        imagesHtml = `<img src='https://via.placeholder.com/40' width='40' height='40' style='object-fit:cover;border-radius:4px;' />`;
                    }
                    html += `<tr>
                        <td>${imagesHtml}</td>
                        <td>${item.name || ''}</td>
                        <td>₱ ${(price).toFixed(2)}</td>
                        <td>${item.quantity || 1}</td>
                        <td>₱ ${(subtotal).toFixed(2)}</td>
                    </tr>`;
                });
                html += `</tbody>
                            </table>
                        </div>
                        <h5 class="text-right">Total (Items Only): ₱ ${total.toFixed(2)}</h5>
                        <h5 class="text-right">Shipping Fee: ₱ ${shipping.toFixed(2)}</h5>
                        <h4 class="text-right">Grand Total: ₱ ${(total + shipping).toFixed(2)}</h4>
                    </div>
                </div>`;
            });
            $('#ordersContainer').html(html);
        },
        error: function (err) {
            let msg = err.status === 401 ? '401 Unauthorized: Please log in again.' : 'Failed to load orders.';
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
        }
    });
});
