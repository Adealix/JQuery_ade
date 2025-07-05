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
 
    $("#register").on('click', function (e) {
        e.preventDefault();
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
                console.log(error);
            }
        });
    });

    $("#login").on('click', function (e) {
        e.preventDefault();

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
                Swal.fire({
                    text: data.success,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
                    position: "center"

                });
                sessionStorage.setItem('userId', JSON.stringify(data.user.id))
                sessionStorage.setItem('userEmail', data.user.email)
                window.location.href = 'profile.html'
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
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

    $("#updateBtn").on('click', function (event) {
        event.preventDefault();
        let userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')

        var data = $('#profileForm')[0];
        console.log(data);
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
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: true,
                    position: "center"

                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    // $('#loginBody').load("header.html");


    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('userId')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'login.html';
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
    if (userId) {
        $.ajax({
            url: `${url}api/v1/users/customer-by-userid/${userId}`,
            method: 'GET',
            dataType: 'json',
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
                        $('#avatarPreview').attr('src', res.customer.image_path);
                    }
                }
            }
        });
    }
})