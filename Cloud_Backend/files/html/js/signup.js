function start() {
    $("#errorClass").hide()
}

$(document).ready(function() {
    var signupForm = $("#signupForm");

    signupForm.on("submit", (e) => {
        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "/id/api/register",
            data: {
                username:  $("#username").val(),
                email:  $("#email").val(),
                password:  $("#password").val(),
            },
            success: (data) => {
                document.location.href="/login"
            },
            error: (data) => {
                grecaptcha.reset()
                switch (JSON.parse(data.responseText).errorCode) {
                    case "dev.aurorafn.id.register.invalid_fields":
                        $("#notice").text("Error: Please fill out all fields.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.invalid_captcha":
                        $("#notice").text("Error: Invalid Captcha.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.username_too_big":
                        $("#notice").text("Error: Username is too big.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.email_too_big":
                        $("#notice").text("Error: Email is too big.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.email_already_exists":
                        $("#notice").text("Error: Email already exists.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.username_already_exists":
                        $("#notice").text("Error: Username already exists.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.register.account_limit_reached":
                        $("#notice").text("Error: Too many accounts have been created under your IP.")
                        $("#errorClass").show()
                        break;
                }
            }
        })
    })
})

