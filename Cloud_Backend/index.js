const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const prompt = require('prompt')
const User = require(`${__dirname}/files/models/User`)
const profiles = require(`${__dirname}/files/structs/profile`)
const Friends = require(`${__dirname}/files/models/Friends`)
const Athena = require(`${__dirname}/files/models/Athena`)
const CommonCore = require(`${__dirname}/files/models/CommonCore`)
const Port = process.env.PORT || 4495
const http = require('http')
const server = http.createServer(app)
const fs = require('fs')
const mongoose = require('mongoose')
const path = require('path')
const { Console } = require('console')
global.exchangeCodes = {}
global.clientTokens = []
global.accessTokens = []
global.xmppClients = {}
global.parties = []
global.invites = []
global.pings = []
global.SERVER = server
global.Server_User = null
global.DBG = fs.readFileSync(`${__dirname}/files/server/background.txt`).toString()
global.Server_version = fs.readFileSync(`${__dirname}/files/server/server_version.txt`).toString()

app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require("./services/index"))

mongoose.connect("mongodb://localhost:27017", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true }, async e => {
    if (e) throw e
})
require("./services/party/index")
require("./services/xmpp/index")
server.listen(Port,() => {
    console.log(`Servers Online (Version: ${Server_version}, Port: ${Port})`)
    prompt.get(['Username', "Password"], async (err, result) => {
        const User1 = await User.findOne({ displayName: result.Username })
        if (User1 == null){
            var id = crypto.randomBytes(16).toString('hex')

            var user = new User({ id: id, displayName: result.Username, email: result.Username + "@cloudfn.dev", password: bcrypt.hashSync(result.Password, bcrypt.genSaltSync(10)) })
            user.save()
            var friends = new Friends({ id: id })
            friends.save()
            var commoncore = new CommonCore({ id: id })
            commoncore.save()
            var athena = new Athena({ id: id })
            athena.save()
            console.log("User Created your email is: " + result.Username + "@Cloud.Dev")
        }
        if (User1.displayName == result.Username){
            console.log("User Found Continue!")
        }
    })
})
