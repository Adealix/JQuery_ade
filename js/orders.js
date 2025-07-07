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
    var table = $('#ordersTable').DataTable({
        ajax: {
            url: `${url}api/v1/orders`,
            dataSrc: function(json) {
                if (json.success && Array.isArray(json.orders)) return json.orders;
                if (json.rows) return json.rows;
                if (Array.isArray(json)) return json;
                if (json.data) return json.data;
                return [];
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
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {}
        },
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel'
        ],
        columns: [
            { data: 'order_id' },
            { data: 'date_ordered', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'date_delivery', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'status', render: function(data) {
                let badge = 'secondary';
                if (data === 'processing') badge = 'info';
                if (data === 'delivered') badge = 'success';
                if (data === 'canceled') badge = 'danger';
                return `<span class='badge badge-${badge}'>${data}</span>`;
            }},
            { data: null, render: function(row) {
                // Show customer name (if available)
                let name = row.last_name || '';
                if (row.first_name) name += ', ' + row.first_name;
                return name || row.customer_id || '';
            }},
            { data: null, render: function(data, type, row) {
                return `<a href='#' class='editStatusBtn' data-id='${row.order_id}' data-status='${row.status}'><i class='fas fa-edit' style='font-size:20px'></i></a> ` +
                       `<a href='#' class='deleteOrderBtn' data-id='${row.order_id}'><i class='fas fa-trash-alt' style='font-size:20px;color:red'></i></a>`;
            }}
        ]
    });
    // Edit status button
    $('#ordersTable tbody').on('click', 'a.editStatusBtn', function (e) {
        e.preventDefault();
        var orderId = $(this).data('id');
        var status = $(this).data('status');
        $('#modalOrderId').val(orderId);
        $('#modalStatus').val(status);
        $('#statusModal').modal('show');
    });
    // Save status
    $('#saveStatusBtn').on('click', function () {
        var orderId = $('#modalOrderId').val();
        var status = $('#modalStatus').val();
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/orders/${orderId}`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ status }),
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                $('#statusModal').modal('hide');
                Swal.fire({ icon: 'success', title: 'Order status updated!' });
                table.ajax.reload();
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Update failed');
                Swal.fire({ icon: 'error', title: 'Failed to update order', text: msg });
                if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    });
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
                        table.ajax.reload();
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
});
