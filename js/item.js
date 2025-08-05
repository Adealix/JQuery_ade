$(document).ready(function () {
    const url = 'http://localhost:4000/'

    // Only declare jwtToken once at the top
    var jwtToken = sessionStorage.getItem('jwtToken');
    // Check for admin role on page load
    let isAdmin = false;
    if (jwtToken) {
        try {
            // Decode JWT payload (middle part)
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            if (payload.role && payload.role === 'admin') {
                isAdmin = true;
            }
        } catch (e) {
            // Invalid token, treat as not admin
            isAdmin = false;
        }
    }
    if (!isAdmin) {
        Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'Only authorized admin can access this page.',
            confirmButtonText: 'Go to Home',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }

    // Custom pagination variables
    let currentItemsPage = 1;
    let totalItemsPages = 1;
    let allItems = [];
    let filteredItems = []; // For search functionality
    let itemsPerPage = 10;
    let currentItemsMode = 'pagination'; // 'pagination' or 'infinite'
    let itemsLoading = false;
    let itemsSearchQuery = '';

    // Initialize DataTable with pagination disabled
    var table = $('#itable').DataTable({
        paging: false,
        info: false,
        searching: false,
        ordering: true,
        data: [], // Start with empty data
        dom: 'rt', // Only show table and remove search, info, etc.
        columns: [
            { 
                data: 'item_id', 
                width: '5%'
            },
            { 
                data: 'name', 
                width: '15%'
            },
            { 
                data: 'category', 
                width: '12%'
            },
            {
                data: 'images',
                width: '10%',
                render: function (data, type, row, meta) {
                    if (Array.isArray(data) && data.length > 0) {
                        let imgId = 'img-carousel-' + row.item_id;
                        let imgs = data.map((img, idx) =>
                            `<img src='${url}${img}' data-idx='${idx}' style='display:${idx===0?'inline':'none'};width:50px;height:60px;' class='carousel-img' id='${imgId}-${idx}' />`
                        ).join('');
                        let left = '', right = '';
                        if (data.length > 1) {
                            left = `<button type='button' class='carousel-left' data-imgid='${imgId}' data-count='${data.length}' style='border:none;background:none;'>&lt;</button>`;
                            right = `<button type='button' class='carousel-right' data-imgid='${imgId}' data-count='${data.length}' style='border:none;background:none;'>&gt;</button>`;
                        }
                        return `<div style='display:flex;align-items:center;'>${left}<div>${imgs}</div>${right}</div>`;
                    } else {
                        return '';
                    }
                }
            },
            { 
                data: 'description', 
                width: '20%',
                render: function(data, type, row) {
                    if (type === 'display' && data && data.length > 50) {
                        return '<span title="' + data + '">' + data.substr(0, 50) + '...</span>';
                    }
                    return data || '';
                }
            },
            { 
                data: 'sell_price', 
                width: '8%'
            },
            { 
                data: 'cost_price', 
                width: '8%'
            },
            { 
                data: 'show_item', 
                width: '7%'
            },
            { 
                data: 'quantity', 
                defaultContent: '', 
                width: '7%'
            },
            {
                data: null,
                width: '8%',
                render: function (data, type, row) {
                    return "<a href='#' class = 'editBtn' id='editbtn' data-id=" + data.item_id + "><i class='fas fa-edit' aria-hidden='true' style='font-size:24px' ></i></a><a href='#'  class='deletebtn' data-id=" + data.item_id + "><i  class='fas fa-trash-alt' style='font-size:24px; color:red' ></a></i>";
                }
            }
        ],
        drawCallback: function(settings) {
            // Add carousel navigation event listeners
            $('.carousel-left, .carousel-right').off('click').on('click', function() {
                var imgId = $(this).data('imgid');
                var count = parseInt($(this).data('count'));
                var imgs = $(`img[id^='${imgId}-']`);
                var currentIdx = imgs.index(imgs.filter(':visible'));
                var nextIdx;
                if ($(this).hasClass('carousel-left')) {
                    nextIdx = (currentIdx - 1 + count) % count;
                } else {
                    nextIdx = (currentIdx + 1) % count;
                }
                imgs.hide();
                $(imgs[nextIdx]).show();
            });
        }
    });

    // Load all items function
    function loadAllItems() {
        itemsLoading = true;
        $('.items-loading').show();
        
        $.ajax({
            url: `${url}api/v1/items?all=true`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function(response) {
                // Backend returns {success: true, items: [...]} for all items
                let items = [];
                if (response.success && Array.isArray(response.items)) {
                    items = response.items;
                } else if (response.rows) {
                    items = response.rows;
                } else if (Array.isArray(response)) {
                    items = response;
                } else if (response.data) {
                    items = response.data;
                }
                
                allItems = items;
                filteredItems = allItems; // Initialize filtered data
                totalItemsPages = Math.ceil(filteredItems.length / itemsPerPage);
                
                if (currentItemsMode === 'pagination') {
                    loadItemsPage(1);
                    setupItemsPaginationControls();
                } else {
                    loadItemsInfiniteScroll(1);
                }
            },
            error: function(xhr, error, thrown) {
                console.error('Items AJAX error:', error, thrown, xhr.responseText);
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to load items',
                    text: msg
                }).then(() => {
                    if (xhr.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            },
            complete: function() {
                itemsLoading = false;
                $('.items-loading').hide();
            }
        });
    }

    // Load specific page for pagination mode
    function loadItemsPage(page) {
        if (page < 1 || page > totalItemsPages) return;
        
        currentItemsPage = page;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredItems.slice(startIndex, endIndex);
        
        // Clear and add new data to DataTable
        table.clear();
        table.rows.add(pageData);
        table.draw();
        
        updateItemsPaginationButtons();
    }

    // Load items for infinite scroll mode
    function loadItemsInfiniteScroll(page, append = false) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredItems.slice(startIndex, endIndex);
        
        if (!append) {
            table.clear();
        }
        
        table.rows.add(pageData);
        table.draw();
    }

    // Setup pagination controls
    function setupItemsPaginationControls() {
        const paginationContainer = $('#itemsPaginationContainer');
        if (paginationContainer.length === 0) {
            // Create pagination container if it doesn't exist
            $('#itable_wrapper').after(`
                <div id="itemsPaginationContainer" class="mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="pagination-info">
                            <span id="itemsPageInfo"></span>
                        </div>
                        <div class="pagination-controls">
                            <button type="button" class="btn btn-outline-primary btn-sm" id="prevItemsPage">
                                <i class="fas fa-chevron-left"></i> Previous
                            </button>
                            <span class="mx-3">
                                Page <span id="currentItemsPage"></span> of <span id="totalItemsPages"></span>
                            </span>
                            <button type="button" class="btn btn-outline-primary btn-sm" id="nextItemsPage">
                                Next <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            // Bind pagination events
            $('#prevItemsPage').on('click', function() {
                if (currentItemsPage > 1) {
                    loadItemsPage(currentItemsPage - 1);
                }
            });
            
            $('#nextItemsPage').on('click', function() {
                if (currentItemsPage < totalItemsPages) {
                    loadItemsPage(currentItemsPage + 1);
                }
            });
        }
        
        updateItemsPaginationButtons();
    }

    // Update pagination button states
    function updateItemsPaginationButtons() {
        $('#currentItemsPage').text(currentItemsPage);
        $('#totalItemsPages').text(totalItemsPages);
        
        const startItem = ((currentItemsPage - 1) * itemsPerPage) + 1;
        const endItem = Math.min(currentItemsPage * itemsPerPage, filteredItems.length);
        $('#itemsPageInfo').text(`Showing ${startItem} to ${endItem} of ${filteredItems.length} items`);
        
        $('#prevItemsPage').prop('disabled', currentItemsPage <= 1);
        $('#nextItemsPage').prop('disabled', currentItemsPage >= totalItemsPages);
    }

    // Setup infinite scroll
    function setupItemsInfiniteScroll() {
        let loadedPages = 1;
        
        $(window).on('scroll.itemsInfinite', function() {
            if (itemsLoading || currentItemsMode !== 'infinite') return;
            
            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const documentHeight = $(document).height();
            
            // Load more when near bottom (100px threshold)
            if (scrollTop + windowHeight >= documentHeight - 100) {
                const nextPage = loadedPages + 1;
                const maxPages = Math.ceil(filteredItems.length / itemsPerPage);
                
                if (nextPage <= maxPages) {
                    itemsLoading = true;
                    
                    // Add loading indicator
                    if ($('#itemsInfiniteLoading').length === 0) {
                        $('#itable_wrapper').after(`
                            <div id="itemsInfiniteLoading" class="text-center mt-3">
                                <i class="fas fa-spinner fa-spin"></i> Loading more items...
                            </div>
                        `);
                    } else {
                        $('#itemsInfiniteLoading').show();
                    }
                    
                    setTimeout(() => {
                        loadItemsInfiniteScroll(nextPage, true);
                        loadedPages = nextPage;
                        itemsLoading = false;
                        $('#itemsInfiniteLoading').hide();
                    }, 500);
                }
            }
        });
    }

    // Setup mode switching controls
    function setupItemsModeControls() {
        if ($('#itemsModeContainer').length === 0) {
            $('#itable_wrapper').before(`
                <div id="itemsModeContainer" class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="items-loading" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i> Loading items...
                        </div>
                        <div class="mode-controls">
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-outline-primary active" id="itemsPaginationModeBtn" data-mode="pagination">
                                    <i class="fas fa-th-large"></i> Pagination
                                </button>
                                <button type="button" class="btn btn-outline-primary" id="itemsInfiniteScrollModeBtn" data-mode="infinite">
                                    <i class="fas fa-list"></i> Infinite Scroll
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="search-container">
                            <div class="input-group" style="width: 300px;">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input type="text" class="form-control" id="itemsSearchInput" placeholder="Search items by name, category, or description...">
                                <button class="btn btn-outline-secondary" type="button" id="clearItemsSearch">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            // Bind mode switching events
            $('#itemsPaginationModeBtn, #itemsInfiniteScrollModeBtn').on('click', function() {
                const newMode = $(this).data('mode');
                if (newMode === currentItemsMode) return;
                
                // Update button states
                $('#itemsModeContainer .btn-group .btn').removeClass('active');
                $(this).addClass('active');
                
                // Switch mode
                currentItemsMode = newMode;
                
                if (currentItemsMode === 'pagination') {
                    // Disable infinite scroll
                    $(window).off('scroll.itemsInfinite');
                    $('#itemsInfiniteLoading').hide();
                    $('#itemsPaginationContainer').show();
                    
                    // Load pagination
                    loadItemsPage(1);
                    setupItemsPaginationControls();
                } else {
                    // Enable infinite scroll
                    $('#itemsPaginationContainer').hide();
                    loadItemsInfiniteScroll(1);
                    setupItemsInfiniteScroll();
                }
            });

            // Search functionality
            $('#itemsSearchInput').on('input', function() {
                itemsSearchQuery = $(this).val().toLowerCase().trim();
                filterItems();
            });

            // Clear search
            $('#clearItemsSearch').on('click', function() {
                $('#itemsSearchInput').val('');
                itemsSearchQuery = '';
                filterItems();
            });
        }
    }

    // Filter items based on search query
    function filterItems() {
        if (!itemsSearchQuery) {
            filteredItems = allItems;
        } else {
            filteredItems = allItems.filter(item => {
                return (
                    (item.name && item.name.toLowerCase().includes(itemsSearchQuery)) ||
                    (item.category && item.category.toLowerCase().includes(itemsSearchQuery)) ||
                    (item.description && item.description.toLowerCase().includes(itemsSearchQuery)) ||
                    (item.item_id && item.item_id.toString().includes(itemsSearchQuery)) ||
                    (item.sell_price && item.sell_price.toString().includes(itemsSearchQuery)) ||
                    (item.show_item && item.show_item.toLowerCase().includes(itemsSearchQuery))
                );
            });
        }

        // Update pagination
        totalItemsPages = Math.ceil(filteredItems.length / itemsPerPage);
        currentItemsPage = 1; // Reset to first page

        // Reload current view
        if (currentItemsMode === 'pagination') {
            loadItemsPage(1);
            updateItemsPaginationButtons();
        } else {
            // Reset infinite scroll
            $(window).off('scroll.itemsInfinite');
            loadItemsInfiniteScroll(1);
            setupItemsInfiniteScroll();
        }
    }

    // Initialize
    setupItemsModeControls();
    loadAllItems();

    // Enhanced validation for item form with inline error display
    function clearInlineErrors() {
        $('.invalid-feedback').remove();
        $('.is-invalid').removeClass('is-invalid');
    }
    function showInlineError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        if ($input.next('.invalid-feedback').length === 0) {
            $input.after(`<div class="invalid-feedback" style="display:block;">${message}</div>`);
        }
    }
    function validateItemForm() {
        let valid = true;
        clearInlineErrors();
        // Name (required, min 2 chars, alpha only)
        let name = $('#name').val().trim();
        if (!name) {
            valid = false;
            showInlineError('#name', 'Name is required.');
        } else if (name.length < 2) {
            valid = false;
            showInlineError('#name', 'Name must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(name)) {
            valid = false;
            showInlineError('#name', 'Name must contain only letters.');
        }
        // Category (required selection)
        let category = $('#category').val();
        if (!category || category === '') {
            valid = false;
            showInlineError('#category', 'Please select a category.');
        }
        // Description (required, min 5 chars, allow letters, numbers, punctuation)
        let desc = $('#desc').val().trim();
        if (!desc) {
            valid = false;
            showInlineError('#desc', 'Description is required.');
        } else if (desc.length < 5) {
            valid = false;
            showInlineError('#desc', 'Description must be at least 5 characters.');
        } else if (!/^[A-Za-z0-9 .,;:!?'"()\-]+$/.test(desc)) {
            valid = false;
            showInlineError('#desc', 'Description contains invalid characters.');
        }
        // Sell Price (required, must be a number > 0, numbers only)
        let sell = $('#sell').val();
        if (!sell || isNaN(sell) || Number(sell) <= 0) {
            valid = false;
            showInlineError('#sell', 'Sell Price is required and must be greater than 0.');
        } else if (!/^\d+(\.\d{1,2})?$/.test(sell)) {
            valid = false;
            showInlineError('#sell', 'Sell Price must be a valid number.');
        }
        // Cost Price (required, must be a number >= 0, numbers only)
        let cost = $('#cost').val();
        if (cost === '' || isNaN(cost) || Number(cost) < 0) {
            valid = false;
            showInlineError('#cost', 'Cost Price is required and must be 0 or greater.');
        } else if (!/^\d+(\.\d{1,2})?$/.test(cost)) {
            valid = false;
            showInlineError('#cost', 'Cost Price must be a valid number.');
        }
        // Quantity (required, must be integer >= 0)
        let qty = $('#qty').val();
        if (qty === '' || isNaN(qty) || !Number.isInteger(Number(qty)) || Number(qty) < 0) {
            valid = false;
            showInlineError('#qty', 'Quantity is required and must be a non-negative integer.');
        }
        // Show Item (required)
        if (!$('#show_item').val()) {
            valid = false;
            showInlineError('#show_item', 'Show Item selection is required.');
        }
        // Images (optional, but if present, check type and size)
        let files = $('#img')[0].files;
        for (let i = 0; i < files.length; i++) {
            let ext = files[i].name.split('.').pop().toLowerCase();
            let allowed = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            if (!allowed.includes(ext)) {
                valid = false;
                showInlineError('#img', 'Only image files are allowed (jpg, jpeg, png, gif, bmp, webp).');
                break;
            }
            if (files[i].size > 15 * 1024 * 1024) { // 15MB limit
                valid = false;
                showInlineError('#img', 'Each image must be less than 15MB.');
                break;
            }
        }
        return valid;
    }

    $("#itemSubmit").on('click', function (e) {
        e.preventDefault();
        if (!validateItemForm()) {
            return;
        }
        let formData = new FormData();
        $('#iform').serializeArray().forEach(function(field) {
            formData.append(field.name, field.value);
        });
        let files = $('#img')[0].files;
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/items`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                $("#itemModal").modal("hide");
                
                // Reset the form and modal state completely
                $("#iform").trigger("reset");
                $('#itemId').remove(); // Remove any hidden item_id input
                $('#itemImage').remove(); // Remove any existing image preview
                clearInlineErrors(); // Clear any validation errors
                
                // Reset modal state flags
                isEditItem = false;
                
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: 'Item added successfully!'
                });
                // Reload data instead of using DataTable's ajax.reload
                loadAllItems();
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Create failed');
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to create item',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
    });

    // When the Edit button is clicked in the table
    $('#itable tbody').on('click', 'a.editBtn', function (e) {
        e.preventDefault(); // Prevent default link behavior
        $('#itemImage').remove() // Remove any existing image preview from the form
        $('#itemId').remove() // Remove any existing hidden item_id input
        $("#iform").trigger("reset"); // Reset the form fields
        var id = $(this).data('id'); // Get the item id from the clicked button
        $('#itemModal').modal('show'); // Show the item modal for editing
        // Add a hidden input with the item id to the form
        $('<input>').attr({ type: 'hidden', id: 'itemId', name: 'item_id', value: id }).appendTo('#iform');
        $('#itemSubmit').hide(); // Hide the Add button
        $('#itemUpdate').show(); // Show the Update button
        $('#itemModalTitle').text('Update Item'); // Set modal title for Edit
        // Fetch the item data from the backend and fill the form
        $.ajax({
            method: "GET",
            url: `${url}api/v1/items/${id}`,
            dataType: "json",
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                // Backend returns {success: true, item: {...}}
                if (data.success && data.item) {
                    const item = data.item;
                    $('#name').val(item.name);
                    $('#category').val(item.category);
                    $('#desc').val(item.description);
                    $('#sell').val(item.sell_price);
                    $('#cost').val(item.cost_price);
                    $('#qty').val(item.quantity);
                    $('#show_item').val(item.show_item);
                    if (item.image_path) {
                        $("#iform").append(`<img src="${url}${item.image_path}" width='200px' height='200px' id="itemImage" />`);
                    }
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Failed to fetch item data');
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to fetch item',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
    });

    $("#itemUpdate").on('click', function (e) {
        e.preventDefault();
        if (!validateItemForm()) {
            return;
        }
        var id = $('#itemId').val();
        var table = $('#itable').DataTable();
        let formData = new FormData();
        $('#iform').serializeArray().forEach(function(field) {
            formData.append(field.name, field.value);
        });
        formData.append('_method', 'PUT');
        let files = $('#img')[0].files;
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                $('#itemModal').modal("hide");
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: 'Item updated successfully!'
                });
                // Reload data instead of using DataTable's ajax.reload
                loadAllItems();
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Update failed');
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to update item',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
    });

    // Enhanced delete confirmation with SweetAlert
    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        var table = $('#itable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        var itemName = $row.find('td:eq(1)').text(); // Get item name from second column
        
        Swal.fire({
            title: 'Delete Confirmation',
            html: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Are you sure?</h3>
                    <p style="color: #7f8c8d; font-size: 16px; margin-bottom: 10px;">
                        You are about to delete the item:
                    </p>
                    <p style="color: #e74c3c; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                        "${itemName}"
                    </p>
                    <p style="color: #7f8c8d; font-size: 14px;">
                        This action cannot be undone. All data associated with this item will be permanently removed.
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: '<i class="fas fa-trash-alt"></i> Yes, Delete It!',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'modern-swal-popup',
                title: 'modern-swal-title',
                confirmButton: 'modern-swal-confirm',
                cancelButton: 'modern-swal-cancel'
            },
            buttonsStyling: false,
            focusCancel: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Deleting...',
                    html: `
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                            <p style="margin-top: 15px; color: #7f8c8d;">Please wait while we delete the item...</p>
                        </div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'modern-swal-popup'
                    }
                });
                
                $.ajax({
                    method: "DELETE",
                    url: `${url}api/v1/items/${id}`,
                    dataType: "json",
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                    success: function (data) {
                        $row.fadeOut(400, function () {
                            // Reload data instead of using DataTable row removal
                            loadAllItems();
                        });
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted Successfully!',
                            html: `
                                <div style="text-align: center; padding: 15px;">
                                    <p style="color: #27ae60; font-size: 16px; margin-bottom: 10px;">
                                        The item "${itemName}" has been successfully deleted.
                                    </p>
                                    <p style="color: #7f8c8d; font-size: 14px;">
                                        The item has been removed from your inventory.
                                    </p>
                                </div>
                            `,
                            confirmButtonColor: '#27ae60',
                            confirmButtonText: '<i class="fas fa-check"></i> Great!',
                            customClass: {
                                popup: 'modern-swal-popup',
                                confirmButton: 'modern-swal-success'
                            },
                            buttonsStyling: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    },
                    error: function (xhr) {
                        let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Delete failed');
                        Swal.fire({
                            icon: 'error',
                            title: 'Delete Failed',
                            html: `
                                <div style="text-align: center; padding: 15px;">
                                    <p style="color: #e74c3c; font-size: 16px; margin-bottom: 10px;">
                                        Failed to delete the item "${itemName}".
                                    </p>
                                    <p style="color: #7f8c8d; font-size: 14px;">
                                        ${msg}
                                    </p>
                                </div>
                            `,
                            confirmButtonColor: '#e74c3c',
                            confirmButtonText: '<i class="fas fa-exclamation-triangle"></i> OK',
                            customClass: {
                                popup: 'modern-swal-popup',
                                confirmButton: 'modern-swal-error'
                            },
                            buttonsStyling: false
                        }).then(() => {
                            if (xhr.status === 401) {
                                sessionStorage.clear();
                                window.location.href = 'login.html';
                            }
                        });
                    }
                });
            }
        });
    });

    // Fix: Set modal title and buttons for Add/Edit Item
    // Use a global flag to track edit mode
    let isEditItem = false;

    // When Add button is clicked
    $(document).on('click', '[data-target="#itemModal"]', function () {
      isEditItem = false;
      // Reset form completely when Add button is clicked
      $("#iform").trigger("reset");
      $('#itemId').remove(); // Remove any hidden item_id input
      $('#itemImage').remove(); // Remove any existing image preview
      clearInlineErrors(); // Clear any validation errors
    });

    // When Edit icon is clicked (assuming .editBtn is the class)
    $(document).on('click', '.editBtn', function () {
      isEditItem = true;
    });

    $('#itemModal').on('show.bs.modal', function () {
      if (isEditItem) {
        $('#itemModalTitle').text('Update Item');
        $('#itemSubmit').hide();
        $('#itemUpdate').show();
      } else {
        $('#itemModalTitle').text('Create New Item');
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
        // Ensure form is clean for new item
        $("#iform").trigger("reset");
        $('#itemId').remove();
        $('#itemImage').remove();
        clearInlineErrors();
      }
    });
    
    // Reset form state when modal is hidden
    $('#itemModal').on('hidden.bs.modal', function () {
      $("#iform").trigger("reset");
      $('#itemId').remove();
      $('#itemImage').remove();
      clearInlineErrors();
      isEditItem = false; // Reset edit flag
    });
    
    // Custom Export Functions
    function exportToPDF() {
        // Use allItems array instead of DataTable data
        if (allItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No items to export.'
            });
            return;
        }
        
        // Create PDF content
        var docDefinition = {
            content: [
                { 
                    text: 'GadgetEssence - Items Report', 
                    fontSize: 16, 
                    alignment: 'center', 
                    margin: [0, 0, 0, 20] 
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['10%', '20%', '15%', '25%', '12%', '12%', '8%', '8%'],
                        body: [
                            ['ID', 'Name', 'Category', 'Description', 'Sell Price', 'Cost Price', 'Show Item', 'Quantity'],
                            ...allItems.map(item => [
                                item.item_id || '',
                                item.name || '',
                                item.category || '',
                                item.description || '',
                                item.sell_price || '',
                                item.cost_price || '',
                                item.show_item || '',
                                item.quantity || ''
                            ])
                        ]
                    }
                }
            ],
            styles: {
                tableHeader: {
                    fillColor: '#667eea',
                    color: 'white',
                    fontSize: 10
                }
            },
            defaultStyle: {
                fontSize: 9
            }
        };
        
        pdfMake.createPdf(docDefinition).download('GadgetEssence-Items-Report.pdf');
    }
    
    function exportToExcel() {
        // Use allItems array instead of DataTable data
        if (allItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No items to export.'
            });
            return;
        }
        
        // Create CSV content
        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Name,Category,Description,Sell Price,Cost Price,Show Item,Quantity\n";
        
        allItems.forEach(item => {
            var row = [
                item.item_id || '',
                (item.name || '').replace(/"/g, '""'), // Escape quotes
                (item.category || '').replace(/"/g, '""'),
                (item.description || '').replace(/"/g, '""'),
                item.sell_price || '',
                item.cost_price || '',
                item.show_item || '',
                item.quantity || ''
            ].map(field => `"${field}"`).join(",");
            csvContent += row + "\n";
        });
        
        // Create download link
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "GadgetEssence-Items-Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Custom Export Button Handlers
    $('#exportItemsPDF').on('click', function() {
        $(this).addClass('loading');
        try {
            exportToPDF();
        } catch (error) {
            console.error('PDF Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to generate PDF report.'
            });
        }
        setTimeout(() => {
            $(this).removeClass('loading');
        }, 1000);
    });
    
    $('#exportItemsExcel').on('click', function() {
        $(this).addClass('loading');
        try {
            exportToExcel();
        } catch (error) {
            console.error('Excel Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to generate Excel report.'
            });
        }
        setTimeout(() => {
            $(this).removeClass('loading');
        }, 1000);
    });
})