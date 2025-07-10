$(document).ready(function () {
    const url = 'http://localhost:4000/'

    // const getToken = () => {
    //     const userId = sessionStorage.getItem('userId');

    //     if (!userId) {
    //         Swal.fire({
    //             icon: 'warning',
    //             text: 'You must be logged in to access this page.',
    //             showConfirmButton: true
    //         }).then(() => {
    //             window.location.href = 'login.html';
    //         });
    //         return;
    //     }
    //     return true
    // }
 
    // Inline error helpers for user forms
    function clearUserInlineErrors() {
        $('.invalid-feedback').remove();
        $('.is-invalid').removeClass('is-invalid');
    }
    function showUserInlineError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        if ($input.next('.invalid-feedback').length === 0) {
            $input.after(`<div class="invalid-feedback" style="display:block;">${message}</div>`);
        }
    }
    function validateRegisterForm() {
        let valid = true;
        clearUserInlineErrors();
        let last_name = $('#last_name').val().trim();
        let first_name = $('#first_name').val().trim();
        let email = $('#email').val().trim();
        let password = $('#password').val();
        // Last Name (required, min 2 chars, alpha only)
        if (!last_name) {
            valid = false;
            showUserInlineError('#last_name', 'Last name is required.');
        } else if (last_name.length < 2) {
            valid = false;
            showUserInlineError('#last_name', 'Last name must be at least 2 characters.');
        } else if (!/^[A-Za-z]+$/.test(last_name)) {
            valid = false;
            showUserInlineError('#last_name', 'Last name must contain only letters.');
        }
        // First Name (required, min 2 chars, alpha only)
        if (!first_name) {
            valid = false;
            showUserInlineError('#first_name', 'First name is required.');
        } else if (first_name.length < 2) {
            valid = false;
            showUserInlineError('#first_name', 'First name must be at least 2 characters.');
        } else if (!/^[A-Za-z]+$/.test(first_name)) {
            valid = false;
            showUserInlineError('#first_name', 'First name must contain only letters.');
        }
        // Email (only allow a-z, A-Z, 0-9, @, . and must be in format user@mail.com)
        if (!email) {
            valid = false;
            showUserInlineError('#email', 'Email is required.');
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            valid = false;
            showUserInlineError('#email', 'Invalid email format. Only letters, numbers, @ and . are allowed.');
        } else if (/[^a-zA-Z0-9@.]/.test(email.replace(/@|\./g, ''))) {
            valid = false;
            showUserInlineError('#email', 'Email must not contain special characters except @ and .');
        }
        // Password
        if (!password) {
            valid = false;
            showUserInlineError('#password', 'Password is required.');
        } else if (password.length < 6) {
            valid = false;
            showUserInlineError('#password', 'Password must be at least 6 characters.');
        }
        return valid;
    }
    // Inline error helpers for profile form (like item.js)
    function clearProfileInlineErrors() {
        $('#profileForm .invalid-feedback').remove();
        $('#profileForm .is-invalid').removeClass('is-invalid');
    }
    function showProfileInlineError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        if ($input.next('.invalid-feedback').length === 0) {
            $input.after(`<div class="invalid-feedback" style="display:block;">${message}</div>`);
        }
    }
    function validateProfileForm() {
        let valid = true;
        clearProfileInlineErrors();
        // Last Name (required, min 2 chars, alpha only)
        let last_name = $('#last_name').val().trim();
        if (!last_name) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name is required.');
        } else if (last_name.length < 2) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name must be at least 2 characters.');
        } else if (!/^[A-Za-z]+$/.test(last_name)) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name must contain only letters.');
        }
        // First Name (required, min 2 chars, alpha only)
        let first_name = $('#first_name').val().trim();
        if (!first_name) {
            valid = false;
            showProfileInlineError('#first_name', 'First name is required.');
        } else if (first_name.length < 2) {
            valid = false;
            showProfileInlineError('#first_name', 'First name must be at least 2 characters.');
        } else if (!/^[A-Za-z]+$/.test(first_name)) {
            valid = false;
            showProfileInlineError('#first_name', 'First name must contain only letters.');
        }
        // Address (required)
        let address = $('#address').val().trim();
        if (!address) {
            valid = false;
            showProfileInlineError('#address', 'Address is required.');
        }
        // City (required, alpha only)
        let city = $('#city').val().trim();
        if (!city) {
            valid = false;
            showProfileInlineError('#city', 'City is required.');
        } else if (!/^[A-Za-z ]+$/.test(city)) {
            valid = false;
            showProfileInlineError('#city', 'City must contain only letters.');
        }
        // Zip code (required, 4-8 alphanumeric)
        let zipcode = $('#zipcode').val().trim();
        if (!zipcode) {
            valid = false;
            showProfileInlineError('#zipcode', 'Zip code is required.');
        } else if (!/^[a-zA-Z0-9\- ]{4,8}$/.test(zipcode)) {
            valid = false;
            showProfileInlineError('#zipcode', 'Zip code must be 4-8 letters/numbers.');
        }
        // Phone (required, 7-15 digits, numbers only)
        let phone = $('#phone').val().trim();
        if (!phone) {
            valid = false;
            showProfileInlineError('#phone', 'Phone is required.');
        } else if (!/^\d{7,15}$/.test(phone)) {
            valid = false;
            showProfileInlineError('#phone', 'Phone must be 7-15 digits and numbers only.');
        }
        // Optionally: validate avatar file type/size if present
        let avatar = $('#avatar')[0];
        if (avatar && avatar.files && avatar.files.length > 0) {
            let file = avatar.files[0];
            let ext = file.name.split('.').pop().toLowerCase();
            let allowed = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            if (!allowed.includes(ext)) {
                valid = false;
                showProfileInlineError('#avatar', 'Only image files are allowed (jpg, jpeg, png, gif, bmp, webp).');
            }
            if (file.size > 2 * 1024 * 1024) {
                valid = false;
                showProfileInlineError('#avatar', 'Avatar image must be less than 2MB.');
            }
        }
        return valid;
    }
    function validateLoginForm() {
        let valid = true;
        clearUserInlineErrors();
        let email = $('#email').val().trim();
        let password = $('#password').val();
        // Email
        if (!email) {
            valid = false;
            showUserInlineError('#email', 'Email is required.');
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            valid = false;
            showUserInlineError('#email', 'Invalid email format. Only letters, numbers, @ and . are allowed.');
        } else if (/[^a-zA-Z0-9@.]/.test(email.replace(/@|\./g, ''))) {
            valid = false;
            showUserInlineError('#email', 'Email must not contain special characters except @ and .');
        }
        // Password
        if (!password) {
            valid = false;
            showUserInlineError('#password', 'Password is required.');
        }
        return valid;
    }

    // Fix: Use both form submit and #register button click to trigger AJAX registration, but only submit via AJAX once
    function handleRegisterSubmit(e) {
        e.preventDefault();
        if (!validateRegisterForm()) return;
        const last_name  = $('#last_name').val();
        const first_name = $('#first_name').val();
        const email      = $('#email').val();
        const password   = $('#password').val();
        const user = { last_name, first_name, email, password };
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: 'success',
                    title: 'Registration successful!',
                    text: 'You can now log in.',
                    confirmButtonText: 'OK'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'login.html';
                    }
                });
            },
            error: function (error) {
                let msg = 'An error occurred.';
                if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: msg
                });
            }
        });
    }
    $('#registerForm').off('submit').on('submit', handleRegisterSubmit);
    $('#register').off('click').on('click', function(e) {
        e.preventDefault();
        $('#registerForm').submit();
    });

    $("#login").off('click').on('click', function (e) {
        e.preventDefault();
        if (!validateLoginForm()) return;
        let email = $("#email").val()
        let password = $("#password").val()
        let user = {
            email,
            password
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                console.log('LOGIN RESPONSE:', data.user);
                // Show the JWT token in an alert (for debugging)
                if (data.token) {
                    Swal.fire({
                        icon: 'info',
                        title: 'JWT Token',
                        html: `<textarea style='width:100%;height:80px'>${data.token}</textarea>`
                    });
                }
                Swal.fire({
                    text: data.success,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
                    position: "center"

                });
                sessionStorage.setItem('userId', JSON.stringify(data.user.id))
                sessionStorage.setItem('userEmail', data.user.email)
                // Optionally store the token for later use
                if (data.token) sessionStorage.setItem('jwtToken', data.token)
                window.location.href = 'profile.html'
            },
            error: function (error) {
                console.log(error);
                let msg = 'An error occurred.';
                let icon = 'error';
                if (error.status === 401) {
                    msg = error.responseJSON && error.responseJSON.message ? error.responseJSON.message : 'Invalid email or password.';
                } else if (error.status === 403) {
                    msg = error.responseJSON && error.responseJSON.message ? error.responseJSON.message : 'Your account is not active. Please contact an Administrator.';
                    icon = 'warning';
                } else if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                Swal.fire({
                    icon: icon,
                    title: 'Login Failed',
                    text: msg,
                    showConfirmButton: true,
                    position: "center"
                });
            }
        });
    });

    $('#avatar').on('change', function () {
        const file = this.files[0];
        console.log(file)
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#updateBtn").off('click').on('click', function (event) {
        event.preventDefault();
        if (!validateProfileForm()) return;
        let userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')
        let jwtToken = sessionStorage.getItem('jwtToken');
        var data = $('#profileForm')[0];
        let formData = new FormData(data);
        let updateUserId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId');
        formData.append('userId', updateUserId)
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
                    position: "center"
                });
            },
            error: function (error) {
                let msg = 'An error occurred.';
                if (error.status === 401) {
                    msg = '401 Unauthorized: You are not authorized. Please log in again.';
                } else if (error.responseJSON && error.responseJSON.error) {
                    msg = error.responseJSON.error;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: msg,
                    confirmButtonText: 'OK'
                }).then(() => {
                    if (error.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    });

    // $('#loginBody').load("header.html");


    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('userId')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).off('click').on('click', function (e) {
                e.preventDefault();
                var jwtToken = sessionStorage.getItem('jwtToken');
                var userId = sessionStorage.getItem('userId') ? JSON.parse(sessionStorage.getItem('userId')) : null;
                if (jwtToken && userId) {
                    $.ajax({
                        method: 'POST',
                        url: url + 'api/v1/logout',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify({ userId: userId }),
                        headers: { 'Authorization': 'Bearer ' + jwtToken },
                        complete: function () {
                            sessionStorage.clear();
                            window.location.href = 'login.html';
                        }
                    });
                } else {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
            // Hide Register menu (fix: use .parent() for <li> or .closest('.nav-item'))
            $('a.nav-link[href="register.html"]').parent().hide();
        }
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    position: "center"
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    // Autofill profile form if user is logged in
    const userId = JSON.parse(sessionStorage.getItem('userId'));
    const jwtToken = sessionStorage.getItem('jwtToken');
    if (userId && jwtToken) {
        $.ajax({
            url: `${url}api/v1/users/customer-by-userid/${userId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + jwtToken
            },
            success: function(res) {
                if (res.success && res.customer) {
                    $('#title').val(res.customer.title || '');
                    $('#last_name').val(res.customer.last_name || '');
                    $('#first_name').val(res.customer.first_name || '');
                    $('#address').val(res.customer.address || '');
                    $('#city').val(res.customer.city || '');
                    $('#zipcode').val(res.customer.zipcode || '');
                    $('#phone').val(res.customer.phone || '');
                    if (res.customer.image_path) {
                        $('#avatarPreview').attr('src', url + res.customer.image_path);
                    } else {
                        $('#avatarPreview').attr('src', url + 'storage/images/logo1.png');
                    }
                }
            },
            error: function(err) {
                console.log('Auth error or failed to fetch profile:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Authorization Error',
                    text: 'You are not authorized. Please log in again.'
                }).then(() => {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                });
            }
        });
    }

    // Admin DataTable for users/customers (only on users.html)
    if ($('#utable').length) {
        // Use the already-declared jwtToken variable at the top
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
        var table = $('#utable').DataTable({
            ajax: {
                url: `${url}api/v1/users/customers?all=true`,
                dataSrc: 'users',
                error: function(xhr, error, thrown) {
                    let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Failed to load users',
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
                {
                    data: 'image_path',
                    render: function (data) {
                        if (data) {
                            return `<img src='${url}${data}' style='width:50px;height:50px;object-fit:cover;border-radius:50%;' />`;
                        } else {
                            return '';
                        }
                    }
                },
                { data: 'email' },
                { data: 'last_name' },
                { data: 'first_name' },
                { data: 'status' },
                { data: 'role' },
                {
                    data: null,
                    render: function (data, type, row) {
                        return `<a href='#' class='editBtn' data-id='${row.user_id}'><i class='fas fa-edit' style='font-size:24px'></i></a> <a href='#' class='deleteBtn' data-id='${row.user_id}'><i class='fas fa-trash-alt' style='font-size:24px;color:red'></i></a>`;
                    }
                }
            ]
        });

        // Edit button handler
        $('#utable tbody').on('click', 'a.editBtn', function (e) {
            e.preventDefault();
            var data = table.row($(this).parents('tr')).data();
            $('#user_id').val(data.user_id);
            $('#status').val(data.status);
            $('#role').val(data.role);
            // Commented out: populate other fields for future use
            // $('#customer_id').val(data.customer_id);
            // $('#email').val(data.email);
            // $('#last_name').val(data.last_name);
            // $('#first_name').val(data.first_name);
            // $('#address').val(data.address);
            // if (data.image_path) {
            //     $('#imagePreview').attr('src', url + data.image_path).show();
            // } else {
            //     $('#imagePreview').hide();
            // }
            $('#userModal').modal('show');
        });

        // Update user/customer (status and role only)
        $('#userUpdate').on('click', function (e) {
            e.preventDefault();
            let userId = $('#user_id').val();
            let status = $('#status').val();
            let role = $('#role').val();
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/users/customers/${userId}/status-role`,
                data: JSON.stringify({ status, role }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                success: function (data) {
                    $('#userModal').modal('hide');
                    Swal.fire({
                      icon: 'success',
                      title: 'Success',
                      text: 'User updated successfully!'
                    });
                    table.ajax.reload();
                },
                error: function (xhr) {
                    let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Update failed');
                    Swal.fire({
                      icon: 'error',
                      title: 'Failed to update user',
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

        // Delete user/customer
        $('#utable tbody').on('click', 'a.deleteBtn', function (e) {
            e.preventDefault();
            var userId = $(this).data('id');
            bootbox.confirm({
                message: "Do you want to delete this user?",
                buttons: {
                    confirm: { label: 'Yes', className: 'btn-success' },
                    cancel: { label: 'No', className: 'btn-danger' }
                },
                callback: function (result) {
                    if (result) {
                        $.ajax({
                            method: 'DELETE',
                            url: `${url}api/v1/users/customers/${userId}`,
                            dataType: 'json',
                            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                            success: function (data) {
                                table.ajax.reload();
                                bootbox.alert(data.message || 'User deleted.');
                            },
                            error: function (xhr) {
                                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Delete failed');
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Failed to delete user',
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
        });
    }
})