const cookieParser = require("cookie-parser")
const request = require("request")
const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const uuid = require("uuid").v4
const app = express.Router()
const fs = require("fs")

const CommonCore = require(`${__dirname}/../files/models/CommonCore`)
const Friends = require(`${__dirname}/../files/model/Friends`)
const Athena = require(`${__dirname}/../files/model/Athena`)
const User = require(`${__dirname}/../files/model/User`)

var tokens = {}

app.use(cookieParser())

app.post("/api/register", async (req, res) => {
    res.clearCookie("C_ID")
    res.clearCookie("C_TOKEN")

    var yeah = req.body.email && req.body.username && req.body.password

    if (!yeah) return res.status(400).json({
        error: `Missing '${[req.body.email ? null : "email", req.body.username ? null : "username", req.body.password ? null : "password",  
        //req.body.captcha ? null : "captcha"
        ].filter(x => x != null).join(", ")}' field(s).`,
        errorCode: "cloud.id.register.invalid_fields",
        statusCode: 400
    })

    if (req.body.username.length > 32 || req.body.email.length > 50) return res.status(400).json({
        error: `Field '${req.body.username.length > 32 ? "Username" : "Email"}' is too big.`,
        errorCode: `cloud.id.register.${req.body.username.length > 32 ? "username" : "email"}_too_big`,
        statusCode: 400
    })

    var check1 = await User.findOne({displayName: new RegExp(`^${req.body.username}$`, 'i')}).lean().catch(e => next(e))

    if (check1 != null || check2 != null) return res.status(400).json({
        error: `${check2 != null ? "Email" : "Username"} '${check2 != null ? req.body.email : req.body.username}' already exists`,
        errorCode: `cloud.id.register.${check2 != null ? "email" : "username"}_already_exists`,
        statusCode: 400
    })
   
    var id = crypto.randomBytes(16).toString('hex')

    var user = new User({id: id,displayName: req.body.username, email: req.body.email, password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))})
    user.save()
    var friends = new Friends({id: id})
    friends.save()
    var commoncore = new CommonCore({id: id})
    commoncore.save()
    var athena = new Athena({id: id})
    athena.save()

    res.redirect("/login")
})

app.post("/api/login", async (req, res) => {
    var bIsValid = req.body.email && req.body.password

    if (!bIsValid) return res.status(400).json({
        error: `Missing '${[req.body.email ? null : "email", req.body.password ? null : "password"].filter(x => x != null).join(", ")}`,
        errorCode: "cloud.id.login.invalid_fields",
        statusCode: 400
    })

    var check = await User.findOne({email: new RegExp(`^${req.body.email}$`, 'i')}).lean()

    if (check) {
        if (bcrypt.compareSync(req.body.password, check.password)) {
            var token = crypto.randomBytes(16).toString("hex")
            tokens[check.id] = token

            res.cookie("C_ID", check.id)
            res.cookie("C_TOKEN", token)

            if (req.query.redirect) res.redirect("/login")
            else res.json({
                access_token: token,
                account_id: check.id,
                statusCode: 200
            })
        } else return res.status(401).json({
            error: `Incorrect password for the account '${req.body.email}'.`,
            errorCode: "cloud.id.login.password_incorrect",
            statusCode: 401
        })
    } else return res.status(404).json({
        error: `Account under the email '${req.body.email} not found.`,
        errorCode: "cloud.id.login.account_not_found",
        statusCode: 404
    })
    
})

app.get("/api/me", async (req, res) => {
    var bIsValid = req.cookies["C_ID"] && req.cookies["C_TOKEN"]
    if (!bIsValid) return res.status(400).json({
        error: `Missing cookies '${[req.cookies["C_ID"] ? null : "C_ID", req.cookies["C_TOKEN"] ? null : "C_TOKEN"].filter(x => x != null).join(", ")}'.`,
        errorCode: "cloud.id.me.invalid_fields",
        statusCode: 400
    })

    if (tokens[req.cookies["C_ID"]] == req.cookies["C_TOKEN"]) {
        var user = await User.findOne({id: req.cookies["C_ID"]}).lean()
        var athena = await Athena.findOne({id: req.cookies["C_ID"]}).lean()
        var commoncore = await CommonCore.findOne({id: req.cookies["C_ID"]}).lean()

        res.json({
            id: req.cookies["C_ID"],
            displayName: user.displayName,
            email: user.email,
            athena: {
                stage: athena.stage,
                level: athena.level
            },
            commoncore: {
                vbucks: commoncore.vbucks
            },
            misc: {
                allowsGifts: user.allowsGifts
            }           
        })
    } else return res.status(401).json({
        error: `Invalid auth token '${req.cookies["C_TOKEN"]}'.`,
        errorCode: "cloud.id.me.invalid_auth_token",
        statusCode: 401
    })
})

app.get("/api/kill", (req, res) => {
    if (tokens[req.cookies["C_ID"]] == req.cookies["C_TOKEN"]) delete tokens[req.cookies["C_ID"]]
    res.clearCookie("C_ID")
    res.clearCookie("C_TOKEN")

    if (req.query.redirect) res.redirect("/login")
    else res.status(204).end()
})

app.get("/api/parties", (req, res) => {
    res.setHeader("content-type", "text/plain")
    res.send(parties.length.toString())
})

app.get("/api/clients", (req, res) => {
    res.setHeader("content-type", "text/plain")
    res.send(Object.keys(xmppClients).length.toString())
})


module.exports = app
