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
                html += `<div class="card mb-4 order-card">
                    <div class="card-header bg-primary text-white">
                        <strong>Order #${order.order_id}</strong> - ${order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : ''}
                        <button class="btn btn-info btn-sm float-right ml-2 view-receipt" data-orderid="${order.order_id}">View Receipt</button>
                        <button class="btn btn-secondary btn-sm float-right download-receipt" data-orderid="${order.order_id}">Download PDF</button>
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
    // Add handlers for receipt buttons
    $(document).on('click', '.view-receipt', function() {
        const orderId = $(this).data('orderid');
        const jwtToken = sessionStorage.getItem('jwtToken') || '';
        if (!jwtToken) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to view the receipt.'
            });
            return;
        }
        $.ajax({
            url: `http://localhost:4000/api/v1/orders/${orderId}/receipt-html`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function (data) {
                // Open a new window and write the HTML content
                const receiptWindow = window.open('', '_blank');
                if (receiptWindow) {
                    receiptWindow.document.open();
                    receiptWindow.document.write(data);
                    receiptWindow.document.close();
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: 'Popup blocked. Please allow popups for this site.'
                    });
                }
            },
            error: function (err) {
                let msg = 'Failed to load receipt.';
                if (err.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (err.responseJSON && err.responseJSON.message) {
                    msg = err.responseJSON.message;
                }
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
    $(document).on('click', '.download-receipt', function() {
        const orderId = $(this).data('orderid');
        const jwtToken = sessionStorage.getItem('jwtToken') || '';
        if (!jwtToken) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to download the receipt.'
            });
            return;
        }
        $.ajax({
            url: `http://localhost:4000/api/v1/orders/${orderId}/receipt-pdf`,
            method: 'GET',
            xhrFields: { responseType: 'blob' }, // Important for binary data
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function (data, status, xhr) {
                const blob = new Blob([data], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `OrderReceipt_${orderId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            error: function (err) {
                let msg = 'Failed to download receipt.';
                if (err.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (err.responseJSON && err.responseJSON.message) {
                    msg = err.responseJSON.message;
                }
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
});
