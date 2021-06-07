const express = require('express')
const app = express()
const Port = process.env.PORT || 4495
const http = require('http')
const server = http.createServer(app)
const fs = require('fs')
const mongoose = require('mongoose')
global.exchangeCodes = {}
global.clientTokens = []
global.accessTokens = []
global.xmppClients = {}
global.parties = []
global.invites = []
global.pings = []
global.SERVER = server
global.Server_version = fs.readFileSync(`${__dirname}/files/server/server_version.txt`).toString()

app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({extended: true}))

app.use(require("./services/index"))

mongoose.connect("mongodb+srv://username:password@host:port/database?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true}, async e => {
    if (e) throw e
})
require("./services/party/index")
require("./services/xmpp/index")
server.listen(Port,() => {
    console.log(`Servers Online (Version: ${Server_version}, Port: ${Port})`)
})