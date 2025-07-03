console.log('user.js loaded!');

$(document).ready(function () {
    console.log('Document ready, setting up event handlers');
    const url = 'http://localhost:4000/'

    // Check if form exists
    console.log('registerForm exists:', $('#registerForm').length > 0);

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

    // Use form submit event for better reliability
    $('#registerForm').on('submit', function (e) {
        console.log('Form submit triggered!');
        e.preventDefault();
        console.log('Default prevented');
        
        // Clear any previous error messages
        $("#registerError").text('');
        
        // Debug: Check if elements exist
        console.log('last_name element exists:', $('#last_name').length > 0);
        console.log('first_name element exists:', $('#first_name').length > 0);
        console.log('email element exists:', $('#email').length > 0);
        console.log('password element exists:', $('#password').length > 0);
        
        let last_name = $("#last_name").val().trim();
        let first_name = $("#first_name").val().trim();
        let email = $("#email").val().trim();
        let password = $("#password").val().trim();
        
        // Debug: Log raw values before trim
        console.log('last_name raw:', $("#last_name").val());
        console.log('first_name raw:', $("#first_name").val());
        console.log('email raw:', $("#email").val());
        console.log('password raw:', $("#password").val());
        
        // // Validate all fields are filled
        // if (!last_name || !first_name || !email || !password) {
        //     $("#registerError").text('All fields are required');
        //     return;
        // }
        
        let user = {
            last_name: last_name,
            first_name: first_name,
            email: email,
            password: password
        };
        
        console.log('Register user payload:', user);
        console.log('JSON stringified:', JSON.stringify(user));
        
        // Log each field individually
        console.log('last_name:', last_name, 'length:', last_name.length);
        console.log('first_name:', first_name, 'length:', first_name.length);
        console.log('email:', email, 'length:', email.length);
        console.log('password:', password, 'length:', password.length);
        
        $.ajax({
            type: "POST",
            url: `${url}api/v1/register`,
            data: JSON.stringify(user),
            contentType: 'application/json',
            dataType: "json",
            success: function (data) {
                console.log('Registration success:', data);
                Swal.fire({
                    icon: "success",
                    text: "Registration successful!",
                    position: 'bottom-right'
                });
                // Clear form
                $('#registerForm')[0].reset();
            },
            error: function (xhr, status, error) {
                console.log('AJAX error:', xhr);
                let msg = "Registration failed";
                
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    msg = xhr.responseJSON.error;
                } else if (xhr.responseText) {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        msg = errorData.error || msg;
                    } catch (e) {
                        msg = xhr.responseText;
                    }
                }
                
                $("#registerError").text(msg);
                Swal.fire({
                    icon: "error",
                    text: msg,
                    position: 'bottom-right'
                });
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
            url: `${url}api/v1/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.success,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
                sessionStorage.setItem('userId', JSON.stringify(data.user.id))
                window.location.href = 'profile.html'
            },
            error: function (error) {
                console.log(error);
                Swal.fire({
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

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
        userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')

        var data = $('#profileForm')[0];
        console.log(data);
        let formData = new FormData(data);
        formData.append('userId', userId)

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#loginBody').load("header.html");


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
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    


})
