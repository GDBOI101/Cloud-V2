function checkAuth() {
    $("#error").hide()
    if (document.cookie.split("=").find(x => x.includes("AURORA_TOKEN"))) window.location.replace("/account")
}

$(document).ready(function() {
    var loginForm = $("#loginForm");

    loginForm.on("submit", (e) => {
        e.preventDefault();

        var email = $("#email").val();
        var password = $("#password").val();

        $.ajax({
            type: "POST",
            url: "/id/api/login",
            data: {
                email: $("#email").val(),
                password: $("#password").val()
            },
            success: () => {
                document.location.href = "/account"
            },
            error: (data) => {
                switch (JSON.parse(data.responseText).errorCode) {
                    case "dev.aurorafn.id.login.invalid_fields":
                        $("#notice").text("Error: Please fill out all fields.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.login.account_not_found":
                        $("#notice").text("Error: Account not found.")
                        $("#errorClass").show()
                        break;
                    case "dev.aurorafn.id.login.password_incorrect":
                        $("#notice").text("Error: Incorrect password.")
                        $("#errorClass").show()
                        break;
                    
                }
            },
        })
    })
})