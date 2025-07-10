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

    var table = $('#itable').DataTable({
        ajax: {
            url: `${url}api/v1/items?all=true`, // Admin: fetch all items
            dataSrc: function(json) {
                // Backend returns {success: true, items: [...]} for all items
                if (json.success && Array.isArray(json.items)) return json.items;
                if (json.rows) return json.rows;
                if (Array.isArray(json)) return json;
                if (json.data) return json.data;
                return [];
            },
            error: function(xhr, error, thrown) {
                console.error('DataTable AJAX error:', error, thrown, xhr.responseText);
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
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {}
        },
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel',
            {
                text: 'Add item',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    $("#iform").trigger("reset");
                    $('#itemModal').modal('show');
                    $('#itemUpdate').hide(); // Always hide Update
                    $('#itemSubmit').show(); // Always show Save
                    $('#itemImage').remove();
                    $('#itemModalTitle').text('Create New Item'); // Set modal title for Add
                }
            }
        ],
        columns: [
            { data: 'item_id' },
            { data: 'name' },
            { data: 'category' },
            {
                data: 'images',
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
            { data: 'description' },
            { data: 'sell_price' },
            { data: 'cost_price' },
            { data: 'show_item' },
            { data: 'quantity', defaultContent: '' },
            {
                data: null,
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
        // Category (required, min 2 chars, alpha only)
        let category = $('#category').val().trim();
        if (!category) {
            valid = false;
            showInlineError('#category', 'Category is required.');
        } else if (category.length < 2) {
            valid = false;
            showInlineError('#category', 'Category must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(category)) {
            valid = false;
            showInlineError('#category', 'Category must contain only letters.');
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
            if (files[i].size > 2 * 1024 * 1024) { // 2MB limit
                valid = false;
                showInlineError('#img', 'Each image must be less than 2MB.');
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
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: 'Item added successfully!'
                });
                var $itable = $('#itable').DataTable();
                $itable.ajax.reload()
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
                table.ajax.reload()
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

    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        var table = $('#itable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        bootbox.confirm({
            message: "do you want to delete this item",
            buttons: {
                confirm: {
                    label: 'yes',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'no',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                if (result) {
                    $.ajax({
                        method: "DELETE",
                        url: `${url}api/v1/items/${id}`,
                        dataType: "json",
                        headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                        success: function (data) {
                            $row.fadeOut(400, function () {
                                table.row($row).remove().draw();
                            });
                            bootbox.alert(data.message);
                        },
                        error: function (xhr) {
                            let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Delete failed');
                            Swal.fire({
                              icon: 'error',
                              title: 'Failed to delete item',
                              text: msg
                            }).then(() => {
                              if (xhr.status === 401) {
                                sessionStorage.clear();
                                window.location.href = 'login.html';
                              }
                            });
                        }
                    });
                }
            }
        });
    })

    // Fix: Set modal title and buttons for Add/Edit Item
    // Use a global flag to track edit mode
    let isEditItem = false;

    // When Add button is clicked
    $(document).on('click', '[data-target="#itemModal"]', function () {
      isEditItem = false;
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
      }
    });
})