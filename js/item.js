$(document).ready(function () {
    const url = 'http://localhost:4000/'

    var table = $('#itable').DataTable({
        ajax: {
            url: `${url}api/v1/items`,
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
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to load items',
                  text: xhr.responseText || error
                });
            }
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
                    $('#itemImage').remove()
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

    // Helper function to validate the item form
    function validateItemForm() {
        let valid = true;
        let messages = [];
        // Name (required)
        if (!$('#name').val().trim()) {
            valid = false;
            messages.push('Name is required.');
        }
        // Category (required)
        if (!$('#category').val().trim()) {
            valid = false;
            messages.push('Category is required.');
        }
        // Description (required)
        if (!$('#desc').val().trim()) {
            valid = false;
            messages.push('Description is required.');
        }
        // Sell Price (required, must be a number > 0)
        let sell = $('#sell').val();
        if (!sell || isNaN(sell) || Number(sell) <= 0) {
            valid = false;
            messages.push('Sell Price is required and must be greater than 0.');
        }
        // Cost Price (required, must be a number >= 0)
        let cost = $('#cost').val();
        if (cost === '' || isNaN(cost) || Number(cost) < 0) {
            valid = false;
            messages.push('Cost Price is required and must be 0 or greater.');
        }
        // Quantity (required, must be integer >= 0)
        let qty = $('#qty').val();
        if (qty === '' || isNaN(qty) || !Number.isInteger(Number(qty)) || Number(qty) < 0) {
            valid = false;
            messages.push('Quantity is required and must be a non-negative integer.');
        }
        // Show Item (required)
        if (!$('#show_item').val()) {
            valid = false;
            messages.push('Show Item selection is required.');
        }
        return { valid, messages };
    }

    $("#itemSubmit").on('click', function (e) {
        e.preventDefault();
        var validation = validateItemForm();
        if (!validation.valid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: validation.messages.join('<br>')
            });
            return;
        }
        let formData = new FormData();
        $('#iform').serializeArray().forEach(function(field) {
            formData.append(field.name, field.value);
        });
        // Append all selected files as images[]
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
            error: function (error) {
                console.log(error);
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
        $('#itemSubmit').hide() // Hide the Add button
        $('#itemUpdate').show() // Show the Update button
        // Fetch the item data from the backend and fill the form
        $.ajax({
            method: "GET",
            url: `${url}api/v1/items/${id}`,
            dataType: "json",
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
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#itemUpdate").on('click', function (e) {
        e.preventDefault();
        var validation = validateItemForm();
        if (!validation.valid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: validation.messages.join('<br>')
            });
            return;
        }
        var id = $('#itemId').val();
        var table = $('#itable').DataTable();
        let formData = new FormData();
        $('#iform').serializeArray().forEach(function(field) {
            formData.append(field.name, field.value);
        });
        // Add _method=PUT for method-override support
        formData.append('_method', 'PUT');
        // Append all selected files as images[]
        let files = $('#img')[0].files;
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        $.ajax({
            method: "POST", // Use POST instead of PUT
            url: `${url}api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                $('#itemModal').modal("hide");
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: 'Item updated successfully!'
                });
                table.ajax.reload()
            },
            error: function (error) {
                console.log(error);
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
                        success: function (data) {
                            $row.fadeOut(400, function () {
                                table.row($row).remove().draw();
                            });
                            bootbox.alert(data.message);
                        },
                        error: function (error) {
                            bootbox.alert(error.responseJSON && error.responseJSON.error ? error.responseJSON.error : 'Delete failed');
                        }
                    });
                }
            }
        });
    })
})