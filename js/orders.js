$(document).ready(function () {
    const url = 'http://localhost:4000/';
    var jwtToken = sessionStorage.getItem('jwtToken');
    // Admin check
    let isAdmin = false;
    if (jwtToken) {
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            if (payload.role && payload.role === 'admin') {
                isAdmin = true;
            }
        } catch (e) {
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
    $('#header').load('header.html');

    // Custom pagination variables
    let currentOrdersPage = 1;
    let totalOrdersPages = 1;
    let allOrders = [];
    let filteredOrders = []; // For search functionality
    let ordersPerPage = 10;
    let currentOrdersMode = 'pagination'; // 'pagination' or 'infinite'
    let ordersLoading = false;
    let ordersSearchQuery = '';

    // Initialize DataTable with pagination disabled
    var table = $('#ordersTable').DataTable({
        paging: false,
        info: false,
        searching: false,
        ordering: true,
        data: [], // Start with empty data
        dom: 'rt', // Only show table and remove search, info, etc.
        columns: [
            { data: 'order_id' },
            { data: 'date_ordered', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'date_delivery', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'status', render: function(data) {
                let badgeClass = 'status-badge';
                let iconClass = 'fas fa-clock';
                
                if (data === 'processing') {
                    badgeClass += ' status-processing';
                    iconClass = 'fas fa-clock';
                } else if (data === 'delivered') {
                    badgeClass += ' status-delivered';
                    iconClass = 'fas fa-check-circle';
                } else if (data === 'canceled') {
                    badgeClass += ' status-canceled';
                    iconClass = 'fas fa-times-circle';
                }
                
                return `<span class='${badgeClass}'>
                    <i class='${iconClass} me-1'></i>
                    ${data.charAt(0).toUpperCase() + data.slice(1)}
                </span>`;
            }},
            { data: null, render: function(row) {
                // Show customer name (if available)
                let name = row.last_name || '';
                if (row.first_name) name += ', ' + row.first_name;
                return name || row.customer_id || '';
            }},
            { data: null, render: function(data, type, row) {
                return `<div class="action-buttons">
                    <a href='#' class='editStatusBtn btn btn-sm btn-outline-primary me-2' 
                       data-id='${row.order_id}' data-status='${row.status}' 
                       title="Edit Status">
                        <i class='fas fa-edit'></i>
                    </a>
                    <a href='#' class='deleteOrderBtn btn btn-sm btn-outline-danger' 
                       data-id='${row.order_id}' 
                       title="Delete Order">
                        <i class='fas fa-trash-alt'></i>
                    </a>
                </div>`;
            }}
        ]
    });

    // Load all orders function
    function loadAllOrders() {
        ordersLoading = true;
        $('.orders-loading').show();
        
        $.ajax({
            url: `${url}api/v1/orders`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function(response) {
                let orders = [];
                if (response.success && Array.isArray(response.orders)) {
                    orders = response.orders;
                } else if (response.rows) {
                    orders = response.rows;
                } else if (Array.isArray(response)) {
                    orders = response;
                } else if (response.data) {
                    orders = response.data;
                }
                
                allOrders = orders;
                filteredOrders = allOrders; // Initialize filtered data
                totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
                
                if (currentOrdersMode === 'pagination') {
                    loadOrdersPage(1);
                    setupOrdersPaginationControls();
                } else {
                    loadOrdersInfiniteScroll(1);
                }
            },
            error: function(xhr, error, thrown) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to load orders',
                    text: msg
                }).then(() => {
                    if (xhr.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            },
            complete: function() {
                ordersLoading = false;
                $('.orders-loading').hide();
            }
        });
    }

    // Load specific page for pagination mode
    function loadOrdersPage(page) {
        if (page < 1 || page > totalOrdersPages) return;
        
        currentOrdersPage = page;
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const pageData = filteredOrders.slice(startIndex, endIndex);
        
        // Clear and add new data to DataTable
        table.clear();
        table.rows.add(pageData);
        table.draw();
        
        updateOrdersPaginationButtons();
    }

    // Load orders for infinite scroll mode
    function loadOrdersInfiniteScroll(page, append = false) {
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const pageData = filteredOrders.slice(startIndex, endIndex);
        
        if (!append) {
            table.clear();
        }
        
        table.rows.add(pageData);
        table.draw();
    }

    // Setup pagination controls
    function setupOrdersPaginationControls() {
        const paginationContainer = $('#ordersPaginationContainer');
        if (paginationContainer.length === 0) {
            // Create pagination container if it doesn't exist
            $('#ordersTable_wrapper').after(`
                <div id="ordersPaginationContainer" class="mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="pagination-info">
                            <span id="ordersPageInfo"></span>
                        </div>
                        <div class="pagination-controls">
                            <button type="button" class="btn btn-outline-primary btn-sm" id="prevOrdersPage">
                                <i class="fas fa-chevron-left"></i> Previous
                            </button>
                            <span class="mx-3">
                                Page <span id="currentOrdersPage"></span> of <span id="totalOrdersPages"></span>
                            </span>
                            <button type="button" class="btn btn-outline-primary btn-sm" id="nextOrdersPage">
                                Next <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            // Bind pagination events
            $('#prevOrdersPage').on('click', function() {
                if (currentOrdersPage > 1) {
                    loadOrdersPage(currentOrdersPage - 1);
                }
            });
            
            $('#nextOrdersPage').on('click', function() {
                if (currentOrdersPage < totalOrdersPages) {
                    loadOrdersPage(currentOrdersPage + 1);
                }
            });
        }
        
        updateOrdersPaginationButtons();
    }

    // Update pagination button states
    function updateOrdersPaginationButtons() {
        $('#currentOrdersPage').text(currentOrdersPage);
        $('#totalOrdersPages').text(totalOrdersPages);
        
        const startItem = ((currentOrdersPage - 1) * ordersPerPage) + 1;
        const endItem = Math.min(currentOrdersPage * ordersPerPage, filteredOrders.length);
        $('#ordersPageInfo').text(`Showing ${startItem} to ${endItem} of ${filteredOrders.length} orders`);
        
        $('#prevOrdersPage').prop('disabled', currentOrdersPage <= 1);
        $('#nextOrdersPage').prop('disabled', currentOrdersPage >= totalOrdersPages);
    }

    // Setup infinite scroll
    function setupOrdersInfiniteScroll() {
        let loadedPages = 1;
        
        $(window).on('scroll.ordersInfinite', function() {
            if (ordersLoading || currentOrdersMode !== 'infinite') return;
            
            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const documentHeight = $(document).height();
            
            // Load more when near bottom (100px threshold)
            if (scrollTop + windowHeight >= documentHeight - 100) {
                const nextPage = loadedPages + 1;
                const maxPages = Math.ceil(filteredOrders.length / ordersPerPage);
                
                if (nextPage <= maxPages) {
                    ordersLoading = true;
                    
                    // Add loading indicator
                    if ($('#ordersInfiniteLoading').length === 0) {
                        $('#ordersTable_wrapper').after(`
                            <div id="ordersInfiniteLoading" class="text-center mt-3">
                                <i class="fas fa-spinner fa-spin"></i> Loading more orders...
                            </div>
                        `);
                    } else {
                        $('#ordersInfiniteLoading').show();
                    }
                    
                    setTimeout(() => {
                        loadOrdersInfiniteScroll(nextPage, true);
                        loadedPages = nextPage;
                        ordersLoading = false;
                        $('#ordersInfiniteLoading').hide();
                    }, 500);
                }
            }
        });
    }

    // Setup mode switching controls
    function setupOrdersModeControls() {
        if ($('#ordersModeContainer').length === 0) {
            $('#ordersTable_wrapper').before(`
                <div id="ordersModeContainer" class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="orders-loading" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i> Loading orders...
                        </div>
                        <div class="mode-controls">
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-outline-primary active" id="ordersPaginationModeBtn" data-mode="pagination">
                                    <i class="fas fa-th-large"></i> Pagination
                                </button>
                                <button type="button" class="btn btn-outline-primary" id="ordersInfiniteScrollModeBtn" data-mode="infinite">
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
                                <input type="text" class="form-control" id="ordersSearchInput" placeholder="Search orders by ID, status, or customer name...">
                                <button class="btn btn-outline-secondary" type="button" id="clearOrdersSearch">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            // Bind mode switching events
            $('#ordersPaginationModeBtn, #ordersInfiniteScrollModeBtn').on('click', function() {
                const newMode = $(this).data('mode');
                if (newMode === currentOrdersMode) return;
                
                // Update button states
                $('#ordersModeContainer .btn-group .btn').removeClass('active');
                $(this).addClass('active');
                
                // Switch mode
                currentOrdersMode = newMode;
                
                if (currentOrdersMode === 'pagination') {
                    // Disable infinite scroll
                    $(window).off('scroll.ordersInfinite');
                    $('#ordersInfiniteLoading').hide();
                    $('#ordersPaginationContainer').show();
                    
                    // Load pagination
                    loadOrdersPage(1);
                    setupOrdersPaginationControls();
                } else {
                    // Enable infinite scroll
                    $('#ordersPaginationContainer').hide();
                    loadOrdersInfiniteScroll(1);
                    setupOrdersInfiniteScroll();
                }
            });

            // Search functionality
            $('#ordersSearchInput').on('input', function() {
                ordersSearchQuery = $(this).val().toLowerCase().trim();
                filterOrders();
            });

            // Clear search
            $('#clearOrdersSearch').on('click', function() {
                $('#ordersSearchInput').val('');
                ordersSearchQuery = '';
                filterOrders();
            });
        }
    }

    // Filter orders based on search query
    function filterOrders() {
        if (!ordersSearchQuery) {
            filteredOrders = allOrders;
        } else {
            filteredOrders = allOrders.filter(order => {
                const customerName = (order.last_name || '') + (order.first_name ? ', ' + order.first_name : '') || order.customer_id || '';
                return (
                    (order.order_id && order.order_id.toString().includes(ordersSearchQuery)) ||
                    (order.status && order.status.toLowerCase().includes(ordersSearchQuery)) ||
                    (customerName && customerName.toLowerCase().includes(ordersSearchQuery)) ||
                    (order.customer_id && order.customer_id.toString().includes(ordersSearchQuery))
                );
            });
        }

        // Update pagination
        totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
        currentOrdersPage = 1; // Reset to first page

        // Reload current view
        if (currentOrdersMode === 'pagination') {
            loadOrdersPage(1);
            updateOrdersPaginationButtons();
        } else {
            // Reset infinite scroll
            $(window).off('scroll.ordersInfinite');
            loadOrdersInfiniteScroll(1);
            setupOrdersInfiniteScroll();
        }
    }

    // Initialize
    setupOrdersModeControls();
    loadAllOrders();
    // Edit status button
    $('#ordersTable tbody').on('click', 'a.editStatusBtn', function (e) {
        e.preventDefault();
        var orderId = $(this).data('id');
        var currentStatus = $(this).data('status');
        
        console.log('Editing order:', orderId, 'current status:', currentStatus);
        
        // Populate modal fields
        $('#modalOrderId').val(orderId);
        $('#modalCurrentStatus').val(currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1));
        $('#modalStatus').val(''); // Clear new status selection
        $('#statusModal').modal('show');
    });
    
    // Reset modal when it's closed
    $('#statusModal').on('hidden.bs.modal', function () {
        const $saveBtn = $('#saveStatusBtn');
        $saveBtn.prop('disabled', false).html('Save changes');
        $('#statusForm')[0].reset();
    });
    // Save status
    $('#saveStatusBtn').on('click', function () {
        var orderId = $('#modalOrderId').val();
        var newStatus = $('#modalStatus').val();
        var currentStatus = $('#modalCurrentStatus').val().toLowerCase();

        if (!newStatus) {
            Swal.fire({
                icon: 'warning',
                title: 'Status Required',
                text: 'Please select a status before saving.',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (newStatus === currentStatus) {
            Swal.fire({
                icon: 'info',
                title: 'No Change Required',
                text: 'The selected status is the same as the current status.',
                confirmButtonText: 'OK'
            });
            return;
        }

        console.log('Attempting to update order:', orderId, 'from:', currentStatus, 'to:', newStatus);

        // Validate status transition
        const validationResult = validateStatusTransition(currentStatus, newStatus);
        if (validationResult === false) {
            return; // Validation failed
        }

        // If validation returned 'confirm', the confirmation dialog is shown and will call proceedWithStatusUpdate
        if (validationResult === 'confirm') {
            return;
        }

        // Show SweetAlert loading spinner for up to 10 seconds
        Swal.fire({
            title: 'Updating Order...',
            html: 'Please wait while we update the order and send the email receipt.<br><br><b>This may take up to 10 seconds.</b>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
            timer: 10000,
            timerProgressBar: true
        });

        // Proceed with the update
        proceedWithStatusUpdate(orderId, newStatus, $(this));
    });
    
    // Extracted function for the actual status update process
    function proceedWithStatusUpdate(orderId, newStatus, $saveBtn) {
        
        // Show loading state on button
        $saveBtn.prop('disabled', true).html('<span class="order-status-loading"></span>Updating...');
        console.log('Proceeding with status update for order:', orderId, 'to status:', newStatus);
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/orders/${orderId}`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ status: newStatus }),
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            timeout: 11000, // 11 seconds to allow for backend timeout
            success: function (data) {
                Swal.close(); // Close the loading spinner
                $('#statusModal').modal('hide');
                if (data && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Order Status Updated!',
                        html: `
                            <div class="text-center">
                                <i class="fas fa-check-circle text-success mb-2" style="font-size: 2rem;"></i>
                                <p class="mb-2"><strong>Status updated successfully!</strong></p>
                                <p class="text-muted mb-0">Customer has been notified via email.</p>
                            </div>
                        `,
                        showConfirmButton: true,
                        confirmButtonText: 'Great!',
                        timer: 4000,
                        timerProgressBar: true,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        customClass: {
                            popup: 'gadget-simple-update-popup',
                            confirmButton: 'btn btn-light'
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Order Updated, but...',
                        html: `
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                                <p class="mb-0">${data && data.error ? data.error : 'Unknown issue occurred.'}</p>
                            </div>
                        `,
                        confirmButtonText: 'OK',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        customClass: {
                            popup: 'gadget-simple-update-popup',
                            confirmButton: 'btn btn-light'
                        }
                    });
                }
                // Reload data instead of using DataTable's ajax.reload
                loadAllOrders();
            },
            error: function (xhr, textStatus, errorThrown) {
                Swal.close(); // Close the loading spinner
                $('#statusModal').modal('hide');
                let errorMessage = 'Update failed';
                if (textStatus === 'timeout') {
                    errorMessage = 'The operation took too long (over 10 seconds).<br>It may have failed to update the order or send the email receipt.';
                } else if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (xhr.responseText) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage = response.error || response.message || errorMessage;
                    } catch (e) {
                        errorMessage = xhr.responseText.length > 100 ?
                            'Server returned an unexpected response' : xhr.responseText;
                    }
                } else if (errorThrown) {
                    errorMessage = errorThrown;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    html: `
                        <div class="text-center">
                            <i class="fas fa-times-circle text-danger mb-2" style="font-size: 2rem;"></i>
                            <p class="mb-0">${errorMessage}</p>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'gadget-simple-update-popup',
                        confirmButton: 'btn btn-light'
                    }
                });
            },
            complete: function () {
                $saveBtn.prop('disabled', false).html('Save changes');
            }
        });
    } // End of proceedWithStatusUpdate function
    
    // Order status validation function (for database enum: 'processing', 'delivered', 'canceled')
    function validateStatusTransition(currentStatus, newStatus) {
        const current = currentStatus?.toLowerCase();
        const next = newStatus?.toLowerCase();
        
        // Valid statuses from your database enum
        const validStatuses = ['processing', 'delivered', 'canceled'];
        
        if (!validStatuses.includes(next)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Status',
                text: 'Please select a valid status.',
                confirmButtonText: 'OK'
            });
            return false;
        }
        
        // For testing purposes - allow all status transitions
        return true;
    }
    
    // Delete order
    $('#ordersTable tbody').on('click', 'a.deleteOrderBtn', function (e) {
        e.preventDefault();
        var orderId = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete the order and all its orderlines!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/orders/${orderId}`,
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                    success: function (data) {
                        Swal.fire({ icon: 'success', title: 'Order deleted!' });
                        // Reload data instead of using DataTable's ajax.reload
                        loadAllOrders();
                    },
                    error: function (xhr) {
                        let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Delete failed');
                        Swal.fire({ icon: 'error', title: 'Failed to delete order', text: msg });
                        if (xhr.status === 401) {
                            sessionStorage.clear();
                            window.location.href = 'login.html';
                        }
                    }
                });
            }
        });
    });
    // Download PDF receipt handler (robust against false error popups)
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
            xhrFields: { responseType: 'blob' },
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
            error: function (xhr) {
                // If the response is a PDF, treat as success
                const contentType = xhr.getResponseHeader && xhr.getResponseHeader('Content-Type');
                if (xhr.response && contentType && contentType.indexOf('application/pdf') !== -1) {
                    const blob = new Blob([xhr.response], { type: 'application/pdf' });
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = `OrderReceipt_${orderId}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }
                let msg = 'Failed to download receipt.';
                if (xhr.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
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
    
    // Custom Export Functions
    function exportOrdersToPDF() {
        // Use allOrders array instead of DataTable data
        if (allOrders.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No orders to export.'
            });
            return;
        }
        
        // Create PDF content
        var docDefinition = {
            content: [
                { 
                    text: 'GadgetEssence - Orders Report', 
                    fontSize: 16, 
                    alignment: 'center', 
                    margin: [0, 0, 0, 20] 
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['15%', '20%', '20%', '15%', '25%', '5%'],
                        body: [
                            ['Order ID', 'Date Ordered', 'Date Delivery', 'Status', 'Customer', 'Actions'],
                            ...allOrders.map(order => [
                                order.order_id || '',
                                order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : '',
                                order.date_delivery ? new Date(order.date_delivery).toLocaleDateString() : '',
                                order.status || '',
                                (order.last_name || '') + (order.first_name ? ', ' + order.first_name : '') || order.customer_id || '',
                                'View/Edit'
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
        
        pdfMake.createPdf(docDefinition).download('GadgetEssence-Orders-Report.pdf');
    }
    
    function exportOrdersToExcel() {
        // Use allOrders array instead of DataTable data
        if (allOrders.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No orders to export.'
            });
            return;
        }
        
        // Create CSV content
        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Order ID,Date Ordered,Date Delivery,Status,Customer\n";
        
        allOrders.forEach(order => {
            var customerName = (order.last_name || '') + (order.first_name ? ', ' + order.first_name : '') || order.customer_id || '';
            var row = [
                order.order_id || '',
                order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : '',
                order.date_delivery ? new Date(order.date_delivery).toLocaleDateString() : '',
                order.status || '',
                customerName.replace(/"/g, '""') // Escape quotes
            ].map(field => `"${field}"`).join(",");
            csvContent += row + "\n";
        });
        
        // Create download link
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "GadgetEssence-Orders-Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Custom Export Button Handlers
    $('#exportOrdersPDF').on('click', function() {
        $(this).addClass('loading');
        try {
            exportOrdersToPDF();
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
    
    $('#exportOrdersExcel').on('click', function() {
        $(this).addClass('loading');
        try {
            exportOrdersToExcel();
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
});
