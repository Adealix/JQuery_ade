$(document).ready(function () {
    // Removed header load, now header is directly in home.html
    const url = 'http://localhost:4000/'
    // Fetch all items and display as cards
    $.ajax({
        url: `${url}api/v1/items`,
        method: 'GET',
        dataType: 'json',
        success: function (res) {
            let items = res.items || res.rows || res.data || [];
            if (!Array.isArray(items)) items = [];
            let html = '';
            if (items.length === 0) {
                html = '<div class="alert alert-info">No items found.</div>';
            } else {
                html = '<div class="row">';
                items.forEach(function (item) {
                    html += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            ${item.image_path ? `<img src="${url}${item.image_path}" class="card-img-top" alt="${item.name}">` : ''}
                            <div class="card-body">
                                <h5 class="card-title">${item.name}</h5>
                                <p class="card-text">${item.description}</p>
                                <p class="card-text"><strong>Category:</strong> ${item.category}</p>
                                <p class="card-text"><strong>Price:</strong> ₱${item.sell_price ?? ''}</p>
                                <p class="card-text"><strong>Stock:</strong> ${item.quantity ?? ''}</p>
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
            $('#items').html('<div class="alert alert-danger">Failed to load items.</div>');
        }
    });
});