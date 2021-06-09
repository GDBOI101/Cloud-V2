const Client = require("./C")
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 80 });


wss.on("connection", ws => {
    var client = new Client(ws) 
    console.log("New XMPP Connection")
    ws.on("close", async (lol) => {

        if (client.sender) {
            clearInterval(client.sender)
        }
        if (xmppClients[client.id]) delete xmppClients[client.id]
        console.log("Lost XMPP Connection")
    })
})

wss.on("error", ws => {})