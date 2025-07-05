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
});