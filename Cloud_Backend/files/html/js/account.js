async function grabData() {
    $("#updated-account").hide()
    $("#gift-notice").hide()
    var stages = await $.ajax({
        url: '/files/stages.json',
        type: 'GET',
        dataType: 'json',
        success: (json) => {
            Object.keys(json).forEach(stage => {
                $('#stage').append($('<option>').text(json[stage]).attr('value', stage).attr('id', stage))
            })
            return json
        }
    })
    await $.ajax({
        url: '/files/giftboxes.json',
        type: 'GET',
        dataType: 'json',
        success: (json) => {
            Object.keys(json).forEach(box => {
                $('#giftbox').append($('<option>').text(json[box]).attr('value', box).attr('id', box))
            })
            return json
        }
    })
    $.ajax({
        url: "/id/api/me",
        success: (data) => {
            //$(`#${data.athena.stage}`).attr("selected","selected");
            $("#vbucks").attr("placeholder", data.commoncore.vbucks).val("")
            $("#level").attr("placeholder", data.athena.level).val("")
            $("#accountid").text(data.id)
            $("#username").text(data.displayName)
            $("#giftusername").text(data.displayName)
            $(`#${data.misc.allowsGifts == true ? "yes" : "no"}`).attr("selected","selected");
        },
        error: () => {
            document.location.href = "/id/api/kill?redirect=true"
        }
    }) 
}

async function removeGifts() {
    $.ajax({
        url: "/id/api/gifts",
        type: "DELETE",
        success: () => {
            $("#updated-account").text("Cleared Gifts!")
            $("#updated-account").show()
        },
        error: () => {
            $("#updated-account").text("Unable To Update Account.")
            $("#updated-account").show()        
        }
    }) 
}

$(document).ready(function() {
    var timeout
    var lobbyForm = $("#lobbyForm");

    lobbyForm.on("submit", (e) => {
        e.preventDefault();

        var level = $("#level").val() == "" ? undefined : $("#level").val()
        var vbucks = $("#vbucks").val() == "" ? undefined : $("#vbucks").val()
        $.ajax({
            type: "POST",
            url: "/id/api/update",
            contentType: 'application/json',
            data: JSON.stringify({
                level:  level,
                vbucks:  vbucks,
                allowsGifts: $("#allowgifts").val() == "yes" ? true : false
            }),
            success: (data) => {
                if (data.updated.vbucks) $("#vbucks").attr("placeholder", data.updated.vbucks).val("")
                if (data.updated.level) $("#level").attr("placeholder", data.updated.level).val("")

                $("#level").text("")
                $("#vbucks").text("")

                $("#updated-account").text("Updated Account!")
                $("#updated-account").show()
            },
            error: (data) => {
                clearInterval(timeout)
                setTimeout(() => $("#updated-account").hide(), 5000)
                $("#updated-account").text("Unable To Update Account.")
                $("#updated-account").show()
            }
        })
    })

    var giftForm = $("#giftForm");

    giftForm.on("submit", (e) => {
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: "/id/api/gifts",
            data: {
                to:  $("#gift_username").val(),
                box:  $("#giftbox").val(),
                item:  $("#gift_item").val(),
                message:  $("#gift_message").val(),
            },
            success: (data) => {
                $("#gift-notice").text("Sent Gift!")
                $("#gift-notice").show()
            },
            error: (data) => {
                switch (JSON.parse(data.responseText).errorCode) {
                    case "dev.aurorafn.id.gift.invalid_fields":
                        $("#gift-notice").text("Error: Please fill out all fields.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.giftbox_not_found":
                        $("#gift-notice").text("Error: Giftbox not found.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.cosmetic_not_found":
                        $("#gift-notice").text("Error: Cosmetic not found.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.account_not_found":
                        $("#gift-notice").text("Error: Account not found.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.friendship_not_found":
                        $("#gift-notice").text("Error: Not friends with the account.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.account_too_many_gifts":
                        $("#gift-notice").text("Error: Account has too many gifts.")
                        $("#gift-notice").show()
                        break;
                    case "dev.aurorafn.id.gift.account_gifting_disabled":
                        $("#gift-notice").text("Error: Account has gifting disabled.")
                        $("#gift-notice").show()
                        break;
                    default:
                        $("#gift-notice").text("Error: Unable to send gift.")
                        $("#gift-notice").show()
                        break;
                }
            },
        })
    })
})
