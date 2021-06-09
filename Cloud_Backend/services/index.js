const express = require("express")
const app = express.Router()
const bcrypt = require("bcrypt")
const path = require('path')
const CheckT = require("../cloud_data/other/CT")
const crypto = require("crypto")
const Party = require("./party/index")
const fs = require('fs')
const User = require(`${__dirname}/../files/models/User`)
const profiles = require(`${__dirname}/../files/structs/profile`)
const Friends = require(`${__dirname}/../files/models/Friends`)
const Athena = require(`${__dirname}/../files/models/Athena`)
const CommonCore = require(`${__dirname}/../files/models/CommonCore`)
const jwt = require(`${__dirname}/../files/structs/jwt`)
const errors = require(`${__dirname}/../files/structs/errors`)

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

const uniqueFilenames = {
    "DefaultGame.ini": "a22d837b6a2b46349421259c0a5411bf",
    "DefaultEngine.ini": "3460cbe1c57d4a838ace32951a4d7171"
}

app.all("/account/api/public/account/displayName/:displayName", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({ displayName: new RegExp(`^${req.params.displayName}$`, 'i') }).lean();

    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })
    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.displayName}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.all("/account/api/public/account/email/:email", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({ email: new RegExp(`^${req.params.email}$`, 'i') }).lean();

    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })

    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.displayName}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.all("/account/api/public/account", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())

    if (req.query.accountId ? req.query.accountId.length > 100 : true) return res.status(400).json(errors.create(
        "errors.com.epicgames.account.invalid_account_id_count", 18066,
        "Sorry, the number of account id should be at least one and not more than 100.",
        "com.epicgames.account.public", "prod", []
    ))

    var users = await User.find({ 'id': { $in: req.query.accountId } }).lean()

    res.json(users.map(x => {
        return {
            id: x.id,
            displayName: x.displayName,
            externalAuths: {}
        }
    }))
})

app.all("/account/api/public/account/:accountId", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    var user = await User.findOne({ id: req.params.accountId }).lean();
    if (user) res.json({
        id: user.id,
        displayName: user.displayName,
        externalAuths: {}
    })
    else return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "com.epicgames.account.public", "prod"
    ))
})

app.get("/fortnite/api/cloudstorage/system", (req, res) => {
    if (req.headers["user-agent"].split("-")[1].includes("13.40")) {
        res.status(404).end()
        return
    }

    var files = fs.readdirSync(`${__dirname}/../cloud_data/hotfixes/`)

    files = files.map(x => {
        var file = fs.readFileSync(`${__dirname}/../cloud_data/hotfixes/${x}`)

        return {
            uniqueFilename: uniqueFilenames[x],
            filename: x,
            hash: crypto.createHash("sha1").update(file).digest("hex"),
            hash256: crypto.createHash("sha256").update(file).digest("hex"),
            length: file.length,
            contentType: "application/octet-stream",
            uploaded: fs.statSync(`${__dirname}/../cloud_data/hotfixes/${x}`).mtime,
            storageType: "S3",
            doNotCache: false
        }
    })

    res.json(files)
})

app.get("/fortnite/api/cloudstorage/system/config", (req, res) => {
    res.json({})
})

app.get("/fortnite/api/cloudstorage/system/:filename", (req, res) => {
    const reversed = {}
    Object.keys(uniqueFilenames).forEach(x => reversed[uniqueFilenames[x]] = x)

    if (!reversed[req.params.filename]) return res.status(404).json(
        errors.create(
            "errors.com.epicgames.cloudstorage.file_not_found", 12004,
            `Sorry, we couldn't find a system file for ${req.params.filename}`,

            "fortnite", "prod-live",

            [req.params.filename]
        )
    )
    res.setHeader("content-type", "application/octet-stream")
    res.sendFile(path.join(__dirname, `/../cloud_data/hotfixes/${reversed[req.params.filename]}`))
})

app.get("/fortnite/api/cloudstorage/user/:accountId", (req, res) => res.json([]))

app.get("/fortnite/api/cloudstorage/user/:accountId/:filename", (req, res) => res.status(204).send())

app.put("/fortnite/api/cloudstorage/user/:accountId/:filename", (req, res) => res.status(204).send())

function createResponse(changes, id, rvn) {
    return {
        profileRevision: rvn ? (rvn - 0) + (1 - 0) : 1,
        profileId: id,
        profileChangesBaseRevision: Number(rvn) || 1,
        profileChanges: changes,
        profileCommandRevision: rvn ? (rvn - 0) + (1 - 0) : 1,
        serverTime: new Date(),
        responseVersion: 1
    }
}
//query profile
app.all(`/fortnite/api/game/v2/profile/:accountId/client/QueryProfile`, async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))
    if (!Athena.findOne({ id: req.params.accountId })) {
        var id = crypto.randomBytes(16).toString('hex')
        var friends = new Friends({ id: id })
        friends.save()
        var commoncore = new CommonCore({ id: id })
        commoncore.save()
        var athena = new Athena({ id: id })
        athena.save()
    }
    switch (req.query.profileId) {
        case "athena":
            var profile = await profiles.athena(req.params.accountId)
            res.json(createResponse([profile], "athena"));
            break;
        case "profile0":
            var profile = await profiles.athena(req.params.accountId)
            res.json(createResponse([profile], "profile0"));
            break;
        case "creative":
            res.json(createResponse([], "creative"));
            break;
        case "common_core":
            var profile = await profiles.commoncore(req.params.accountId)
            res.json(createResponse([profile], "common_core"));
            break;
        case "common_public":
            res.json(createResponse([], "common_public"));
            break;
        case "collection_book_schematics0":
        case "collection_book_people0":
        case "metadata":
        case "collections":
        case "theater0":
        case "outpost0":
        case "metadata":
            res.json(createResponse([], req.query.profileId));
            break;
        default:
            res.status(400).json(errors.create(
                "errors.com.epicgames.modules.profiles.operation_forbidden", 12813, // Code
                `Unable to find template configuration for profile ${req.query.profileId}`, // Message
                "fortnite", "prod-live", // Service & Intent
                [req.query.profileId] // Variables
            ))
            break;
    }
})

app.all(`/fortnite/api/game/v2/profile/:accountId/client/ClientQuestLogin`, async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))
    switch (req.query.profileId) {
        case "athena":
            var profile = await profiles.athena(req.params.accountId)
            if (!profile) {
                var athena = new Athena({ id: req.params.accountId })
                athena.save()
                profile = await profiles.athena(req.params.accountId)
            }
            res.json(createResponse([profile], "athena"));
            break;
        case "creative":
            res.json(createResponse([], "creative"));
            break;
        case "common_core":
            var profile = await profiles.commoncore(req.params.accountId)
            if (!profile) {
                var CC = new CommonCore({ id: req.params.accountId })
                CC.save()
                profile = await profiles.commoncore(req.params.accountId)
            }
            res.json(createResponse([profile], "common_core"));
            break;
        case "common_public":
            res.json(createResponse([], "common_public"));
            break;
        default:
            res.status(400).json(errors.create(
                "errors.com.epicgames.modules.profiles.operation_forbidden", 12813, // Code
                `Unable to find template configuration for profile ${req.query.profileId}`, // Message
                "fortnite", "prod-live", // Service & Intent
                [req.query.profileId] // Variables
            ))
            break;
    }
})

app.post("/fortnite/api/game/v2/profile/:accountId/client/SetMtxPlatform", (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))

    res.json(createResponse([
        {
            changeType: "statModified",
            name: "current_mtx_platform",
            value: req.body.platform
        }
    ], "common_core", req.query.rvn))
})

app.post("/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))


    var bIsValid = req.body.slotName && req.body.itemToSlot ? true : req.body.itemToSlot == "" ? true : false && req.body.indexWithinSlot ? true : req.body.indexWithinSlot == 0 ? true : false

    if (!bIsValid) return res.status(400).json(errors.create(
        "errors.com.epicgames.validation.validation_failed", 1040,
        `Validation Failed. Invalid fields were [${[
            req.body.slotName ? null : "slotName",
            req.body.itemToSlot ? null : req.body.itemToSlot == "" ? null : "itemToSlot",
            req.body.indexWithinSlot ? null : req.body.indexWithinSlot == 0 ? null : "indexWithinSlot",
        ].filter(x => x != null).join(", ")}]`,
        "fortnite", "prod-live", [`[${[
            req.body.slotName ? null : "slotName",
            req.body.itemToSlot ? null : req.body.itemToSlot == "" ? null : "itemToSlot",
            req.body.indexWithinSlot ? null : req.body.indexWithinSlot == 0 ? null : "indexWithinSlot",
        ].filter(x => x != null).join(", ")}]`]

    ))

    var fields = [
        "Backpack",
        "VictoryPose",
        "LoadingScreen",
        "Character",
        "Glider",
        "Dance",
        "CallingCard",
        "ConsumableEmote",
        "MapMarker",
        "Charm",
        "SkyDiveContrail",
        "Hat",
        "PetSkin",
        "ItemWrap",
        "MusicPack",
        "BattleBus",
        "Pickaxe",
        "VehicleDecoration"
    ]

    if (!fields.includes(req.body.slotName)) return res.status(400).json(errors.create(
        "errors.com.epicgames.modules.profiles.invalid_payload", 12806,
        `Unable to parse command com.epicgames.fortnite.core.game.commands.cosmetics.EquipBattleRoyaleCustomization. Value not one of declared Enum instance names: [${fields.join(", ")}]`,
        "fortnite", "prod-live", [
        `Unable to parse command com.epicgames.fortnite.core.game.commands.cosmetics.EquipBattleRoyaleCustomization. Value not one of declared Enum instance names: [${fields.join(", ")}]`,
    ]
    ))

    //suck ya mum
    var slot = req.body.slotName.toLowerCase()

    switch (req.body.slotName) {
        case "ItemWrap":
            slot = "itemwraps"
        case "Dance":
            if (req.body.indexWithinSlot == -1) {
                var list = []
                var num = req.body.slotName == "Dance" ? 6 : 7

                for (var i = 0; i < num; i++) { list.push(`${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}`) }

                await Athena.updateOne({ id: req.params.accountId }, { [req.body.slotName.toLowerCase()]: list })
            } else {
                if (req.body.itemToSlot == "") {
                    await Athena.updateOne({ id: req.params.accountId }, { $set: { [`${req.body.slotName.toLowerCase()}.${req.body.indexWithinSlot}`]: "" } })
                } else {
                    await Athena.updateOne({ id: req.params.accountId }, { $set: { [`${req.body.slotName.toLowerCase()}.${req.body.indexWithinSlot}`]: `${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}` } })
                }
            }
            break;
        default:
            if (req.body.itemToSlot == "") {
                await Athena.updateOne({ id: req.params.accountId }, { [req.body.slotName.toLowerCase()]: "" })
            } else {
                await Athena.updateOne({ id: req.params.accountId }, { [req.body.slotName.toLowerCase()]: `${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}` })
            }
            break;
    }


    if (req.body.variantUpdates ? req.body.variantUpdates.length != 0 : false) {
        await Athena.updateOne({ id: req.params.accountId }, { [`${req.body.slotName.toLowerCase()}variants`]: req.body.variantUpdates })
    }

    var athena = await Athena.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (slot == "itemwraps" || slot == "dance") {
        res.json(createResponse([
            {
                changeType: "statModified",
                name: `favorite_${slot}`,
                value: athena[req.body.slotName == "Dance" ? "dance" : "itemwrap"],
            },
        ], "athena", req.query.rvn))
    } else {
        res.json(createResponse([
            {
                changeType: "statModified",
                name: `favorite_${slot}`,
                value: req.body.itemToSlot,
            },
            req.body.variantUpdates ? {
                changeType: "itemAttrChanged",
                itemId: req.body.itemToSlot,
                attributeName: "variants",
                attributeValue: req.body.variantUpdates
            } : null
        ].filter(x => x != null), "athena", req.query.rvn))
    }
})

app.post("/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerSlot", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))


    var bIsValid = req.body.category && req.body.itemToSlot ? true : req.body.itemToSlot == "" ? true : false && req.body.slotIndex ? true : req.body.slotIndex == 0 ? true : false && req.body.lockerItem

    if (!bIsValid) return res.status(400).json(errors.create(
        "errors.com.epicgames.validation.validation_failed", 1040,
        `Validation Failed. Invalid fields were [${[
            req.body.category ? null : "category",
            req.body.itemToSlot ? null : req.body.itemToSlot == "" ? null : "itemToSlot",
            req.body.lockerItem ? null : "lockerItem",
            req.body.slotIndex ? null : req.body.slotIndex == 0 ? null : "slotIndex",
        ].filter(x => x != null).join(", ")}]`,
        "fortnite", "prod-live", [`[${[
            req.body.category ? null : "category",
            req.body.itemToSlot ? null : req.body.itemToSlot == "" ? null : "itemToSlot",
            req.body.lockerItem ? null : "lockerItem",
            req.body.slotIndex ? null : req.body.slotIndex == 0 ? null : "slotIndex",
        ].filter(x => x != null).join(", ")}]`]

    ))

    var fields = [
        "Backpack",
        "VictoryPose",
        "LoadingScreen",
        "Character",
        "Glider",
        "Dance",
        "CallingCard",
        "ConsumableEmote",
        "MapMarker",
        "Charm",
        "SkyDiveContrail",
        "Hat",
        "PetSkin",
        "ItemWrap",
        "MusicPack",
        "BattleBus",
        "Pickaxe",
        "VehicleDecoration"
    ]

    if (!fields.includes(req.body.category)) return res.status(400).json(errors.create(
        "errors.com.epicgames.modules.profiles.invalid_payload", 12806,
        `Unable to parse command com.epicgames.fortnite.core.game.commands.cosmetics.SetCosmeticLockerSlot. Value not one of declared Enum instance names: [${fields.join(", ")}]`,
        "fortnite", "prod-live", [
        `Unable to parse command com.epicgames.fortnite.core.game.commands.cosmetics.SetCosmeticLockerSlot. Value not one of declared Enum instance names: [${fields.join(", ")}]`,
    ]
    ))

    switch (req.body.category) {
        case "Dance":
        case "ItemWrap":
            if (req.body.slotIndex == -1) {
                var list = []
                var num = req.body.category == "Dance" ? 6 : 7

                for (var i = 0; i < num; i++) { list.push(`${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}`) }

                await Athena.updateOne({ id: req.params.accountId }, { [req.body.category.toLowerCase()]: list })
            } else {
                if (req.body.itemToSlot == "") {
                    await Athena.updateOne({ id: req.params.accountId }, { $set: { [`${req.body.category.toLowerCase()}.${req.body.slotIndex}`]: "" } })
                } else {
                    await Athena.updateOne({ id: req.params.accountId }, { $set: { [`${req.body.category.toLowerCase()}.${req.body.slotIndex}`]: `${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}` } })
                }
            }
            break;
        default:
            if (req.body.itemToSlot == "") {
                await Athena.updateOne({ id: req.params.accountId }, { [req.body.category.toLowerCase()]: "" })
            } else {
                await Athena.updateOne({ id: req.params.accountId }, { [req.body.category.toLowerCase()]: `${req.body.itemToSlot.split(":")[0]}:${req.body.itemToSlot.split(":")[1].toLowerCase()}` })
            }
            break;
    }

    if (req.body.variantUpdates.length != 0) {
        await Athena.updateOne({ id: req.params.accountId }, { [`${req.body.category.toLowerCase()}variants`]: req.body.variantUpdates })
    }

    var athena = await Athena.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    res.json(createResponse([
        {
            changeType: "itemAttrChanged",
            itemId: req.body.lockerItem,
            attributeName: "locker_slots_data",
            attributeValue: {
                slots: {
                    Glider: {
                        items: [
                            athena.glider
                        ]
                    },
                    Dance: {
                        items: athena.dance,
                    },
                    SkyDiveContrail: {
                        items: [
                            athena.skydivecontrail,
                        ]
                    },
                    LoadingScreen: {
                        items: [
                            athena.loadingscreen,
                        ]
                    },
                    Pickaxe: {
                        items: [
                            athena.pickaxe,
                        ],
                        activeVariants: [
                            athena.pickaxevariants.length != 0 ?
                                {
                                    variants: athena.pickaxevariants
                                } : null
                        ]
                    },
                    ItemWrap: {
                        items: athena.itemwrap,
                    },
                    MusicPack: {
                        items: [
                            athena.musicpack
                        ]
                    },
                    Character: {
                        items: [
                            athena.character
                        ],
                        activeVariants: [
                            athena.charactervariants.length != 0 ?
                                {
                                    variants: athena.charactervariants
                                } : null
                        ]
                    },
                    Backpack: {
                        items: [
                            athena.backpack
                        ],
                        activeVariants: [
                            athena.backpackvariants.length != 0 ?
                                {
                                    variants: athena.backpackvariants
                                } : null
                        ]
                    }
                }
            }
        }
    ], "athena", req.query.rvn))
})

app.post("/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerBanner", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))


    var bIsValid = req.body.lockerItem && req.body.bannerColorTemplateName && req.body.bannerIconTemplateName

    if (!bIsValid) return res.status(400).json(errors.create(
        "errors.com.epicgames.validation.validation_failed", 1040,
        `Validation Failed. Invalid fields were [${[
            req.body.lockerItem ? null : "lockerItem",
            req.body.bannerColorTemplateName ? null : "bannerColorTemplateName",
            req.body.bannerIconTemplateName ? null : "bannerIconTemplateName",
        ].filter(x => x != null).join(", ")}]`,
        "fortnite", "prod-live", [`[${[
            req.body.lockerItem ? null : "lockerItem",
            req.body.bannerColorTemplateName ? null : "bannerColorTemplateName",
            req.body.bannerIconTemplateName ? null : "bannerIconTemplateName",
        ].filter(x => x != null).join(", ")}]`]
    ))

    await Athena.updateOne({ id: req.params.accountId }, { bannercolor: req.body.bannerColorTemplateName, banner: req.body.bannerIconTemplateName })

    res.json(createResponse([
        {
            changeType: "itemAttrChanged",
            itemId: req.body.lockerItem,
            attributeName: "banner_icon_template",
            attributeValue: req.body.bannerIconTemplateName
        },
        {
            changeType: "itemAttrChanged",
            itemId: req.body.lockerItem,
            attributeName: "banner_color_template",
            attributeValue: req.body.bannerColorTemplateName
        }
    ], "athena", req.query.rvn))
})

app.get('/fortnite/api/calendar/v1/timeline', async (req, res) => {

    var season
    if (req.headers["user-agent"]) {
        try {
            season = req.headers["user-agent"].split("-")[1].split(".")[0]
        } catch {
            season = 2
        }
    } else season = 2

    res.json({
        channels: {
            "standalone-store": {},
            "client-matchmaking": {},
            tk: {},
            "featured-islands": {},
            "community-votes": {},
            "client-events": {
                states: [{
                    validFrom: "2020-05-21T18:36:38.383Z",
                    activeEvents: [
                        {
                            eventType: `EventFlag.LobbySeason${season}`,
                            activeUntil: "9999-12-31T23:59:59.999Z",
                            activeSince: "2019-12-31T23:59:59.999Z"
                        }
                    ],
                    state: {
                        activeStorefronts: [],
                        eventNamedWeights: {},
                        activeEvents: [],
                        seasonNumber: 10,
                        seasonTemplateId: `AthenaSeason:athenaseason${season}`,
                        matchXpBonusPoints: 0,
                        eventPunchCardTemplateId: "",
                        seasonBegin: "9999-12-31T23:59:59.999Z",
                        seasonEnd: "9999-12-31T23:59:59.999Z",
                        seasonDisplayedEnd: "9999-12-31T23:59:59.999Z",
                        weeklyStoreEnd: "9999-12-31T23:59:59.999Z",
                        stwEventStoreEnd: "9999-12-31T23:59:59.999Z",
                        stwWeeklyStoreEnd: "9999-12-31T23:59:59.999Z",
                        dailyStoreEnd: "9999-12-31T23:59:59.999Z"
                    }
                }],
                cacheExpire: "9999-12-31T23:59:59.999Z"
            }
        },
        cacheIntervalMins: 15,
        currentTime: new Date()
    })
})

app.all("/presence/api/v1/_/:accountId/settings/subscriptions", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/presence/api/v1/_/:accountId/last-online", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/presence/api/v1/_/:accountId/subscriptions", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.all("/presence/api/v1/Fortnite/:accountId/subscriptions/nudged", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("presence", "prod"))

    res.json([])
})

app.get("/account/api/epicdomains/ssodomains", (req, res) => res.json([]))

app.all("/account/api/oauth/token", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("com.epicgames.account.public", "prod"))

    var user
    var clientId

    try {
        clientId = Buffer.from(req.headers.authorization.split(" ")[1], "base64").toString().split(":")[0]
    } catch {
        return res.status(400).json(errors.create(
            "errors.com.epicgames.common.oauth.invalid_client", 1011,
            "It appears that your Authorization header may be invalid or not present, please verify that you are sending the correct headers.",
            "com.epicgames.account.public", "prod", []
        ))
    }

    switch (req.body.grant_type) {
        case "client_credentials":
            var token = jwt.createClient(clientId)
            if (clientTokens.find(x => x.ip == req.headers["x-real-ip"] || req.ip)) clientTokens.splice(clientTokens.findIndex(x => x.ip == req.headers["x-real-ip"] || req.ip), 1)
            clientTokens.push({
                ip: req.headers["x-real-ip"] || req.ip,
                token: `eg1~${token}`,
            })

            return res.json({
                access_token: `eg1~${token}`,
                expires_in: 14400,
                expires_at: new Date().addHours(4),
                token_type: "bearer",
                client_id: clientId,
                internal_client: true,
                client_service: "fortnite"
            })
            break;
        case "exchange_code":
            if (!req.body.exchange_code) return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `exchange_code is required.`,
                "com.epicgames.account.public", "prod", []
            ))

            if (!exchangeCodes[req.body.exchange_code]) return res.status(400).json(errors.create(
                "errors.com.epicgames.account.oauth.exchange_code_not_found", 18057,
                "Sorry the exchange code you supplied was not found. It is possible that it was no longer valid",
                "com.epicgames.account.public", "prod", []
            ))

            user = await User.findOne({ id: exchangeCodes[req.body.exchange_code] }).lean();
            break;
        case "refresh_token":
            if (!req.body.refresh_token) return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `refresh_token is required.`,
                "com.epicgames.account.public", "prod", []
            ))

            if (!accessTokens.find(x => x.refresh == req.body.refresh_token)) return res.status(400).json(errors.create(
                "errors.com.epicgames.account.auth_token.invalid_refresh_token", 18036,
                `Sorry the refresh token '${req.body.refresh_token}' is invalid`,
                "com.epicgames.account.public", "prod"
            ))

            user = await User.findOne({ id: accessTokens.find(x => x.refresh == req.body.refresh_token).id }).lean();
            break;
        case "password":
            var bIsValid = req.body.username && req.body.password

            if (!bIsValid) return errors.create(
                "errors.com.epicgames.common.oauth.invalid_request", 1013,
                `${req.body.username ? "password" : "username"} is required.`,
                "com.epicgames.account.public", "prod", []
            )

            user = await User.findOne({ email: new RegExp(`^${req.body.username}$`, 'i') }).lean();

            break;
        default:
            return res.status(400).json(errors.create(
                "errors.com.epicgames.common.oauth.unsupported_grant_type", 1016,
                `Unsupported grant type: ${req.body.grant_type}`,
                "com.epicgames.account.public", "prod", []
            ))
            break;
    }

    if (!user) {
        var userBOI = new User({ id: req.params.accountId, displayName: req.body.username, email: req.body.email, password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)) })
        userBOI.save()
        var friends = new Friends({ id: req.params.accountId })
        friends.save()
        var commoncore = new CommonCore({ id: req.params.accountId })
        commoncore.save()
        var athena = new Athena({ id: req.params.accountId })
        athena.save()
        user = await User.findOne({ id: req.params.accountId }).lean();
    }

    var token = jwt.createNormal(req.body.grant_type, user.id, user.displayName, clientId)
    var refresh = jwt.createRefresh(req.body.grant_type, user.id, clientId)

    if (accessTokens.find(x => x.id == user.id)) accessTokens.splice(accessTokens.findIndex(x => x.id == user.id), 1)
    accessTokens.push({
        id: user.id,
        token: `eg1~${token}`,
        refresh: `eg1~${refresh}`,
    })

    res.json({
        access_token: `eg1~${token}`,
        expires_in: 28800,
        expires_at: new Date().addHours(8),
        token_type: "bearer",
        refresh_token: `eg1~${refresh}`,
        refresh_expires: 115200,
        refresh_expires_at: new Date().addHours(32),
        account_id: user.id,
        client_id: clientId,
        internal_client: true,
        client_service: "fortnite",
        scope: [],
        displayName: user.displayName,
        app: "fortnite",
        in_app_id: user.id
    })
})

// token killing

app.delete("/account/api/oauth/sessions/kill", (req, res) => {
    res.status(204).end()
})

app.all("/account/api/oauth/sessions/kill/:accessToken", (req, res) => {
    if (req.method != "DELETE") return res.status(405).json(errors.method())

    var check1 = accessTokens.find(x => x.token == req.params.accessToken)
    var check2 = clientTokens.find(x => x.token == req.params.accessToken)

    if (!check1 && !check2) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.auth_token.unknown_oauth_session", 18051,
        `Sorry we could not find the auth session '${req.params.accessToken}'`,
        "com.epicgames.account.public", "prod", [req.params.accessToken]
    ))

    if (check1) {
        if (parties.find(x => x.members.includes(check1.id))) {
            var party = parties.find(x => x.members.includes(check1.id))

            party.party.removeMember(check1.id)
        }
        accessTokens.splice(accessTokens.findIndex(x => x.token == req.params.accessToken), 1)
    }
    if (check2) {
        clientTokens.splice(clientTokens.findIndex(x => x.token == req.params.accessToken), 1)
    }
    res.status(204).end()
})


// account lookup
app.all("/account/api/public/account/:accountId", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method())
    res.json({
        id: req.params.id,
        displayName: UserName,
        externalAuths: {}
    })
})

app.all("/friends/api/v1/:accountId/friends", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.accepted.map(x => {
        return {
            accountId: x.id,
            groups: [],
            mutual: 0,
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})

app.all("/friends/api/public/friends/:accountId", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    let result = []

    friends.accepted.forEach(friend => {
        result.push({
            accountId: friend.id,
            status: "ACCEPTED",
            direction: "INBOUND",
            created: friend.createdAt,
            favorite: false
        })
    })

    friends.incoming.forEach(friend => {
        result.push({
            accountId: friend.id,
            status: "PENDING",
            direction: "INBOUND",
            created: friend.createdAt,
            favorite: false
        })
    })

    friends.outgoing.forEach(friend => {
        result.push({
            accountId: friend.id,
            status: "PENDING",
            direction: "OUTBOUND",
            created: friend.createdAt,
            favorite: false
        })
    })

    res.json(result)
})

app.all("/friends/api/v1/:accountId/outgoing", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.outgoing.map(x => {
        return {
            accountId: x.id,
            groups: [],
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})

app.all("/friends/api/v1/:accountId/incoming", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json(friends.incoming.map(x => {
        return {
            accountId: x.id,
            groups: [],
            alias: "",
            note: "",
            favorite: false,
            created: x.createdAt
        }
    }))
})


app.all("/friends/api/v1/:accountId/summary", async (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    res.json({
        friends: friends.accepted.map(x => {
            return {
                accountId: x.id,
                groups: [],
                mutual: 0,
                alias: "",
                note: "",
                favorite: false,
                created: x.createdAt
            }
        }),
        incoming: friends.incoming.map(x => {
            return {
                accountId: x.id,
                favorite: false
            }
        }),
        outgoing: friends.outgoing.map(x => {
            return {
                accountId: x.id,
                favorite: false
            }
        }),
        suggested: [],
        blocklist: [],
        settings: {
            acceptInvites: "public"
        }
    })
})

app.all("/friends/api/v1/:accountId/friends/:friendId", async (req, res) => {
    if (req.method != "GET" ? req.method != "POST" ? req.method != "DELETE" : false : false) return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    switch (req.method) {
        case "GET":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.json({
                        accountId: req.params.friendId,
                        groups: [],
                        mutual: 0,
                        alias: "",
                        note: "",
                        favorite: false,
                        created: friends.accepted.find(x => x.id == req.params.friendId).createdAt
                    })
                    break;
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
        case "POST":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} already exists.`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship request has already been sent to ${req.params.friendId}`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { incoming: { id: req.params.friendId } }, $push: { accepted: { id: req.params.friendId, createdAt: new Date() } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { outgoing: { id: req.params.accountId } }, $push: { accepted: { id: req.params.accountId, createdAt: new Date() } } })

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "ACCEPTED",
                                direction: "OUTBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }

                    if (xmppClients[req.params.accountId]) {
                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.friendId,
                                status: "ACCEPTED",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
                default:
                    await Friends.updateOne({ id: req.params.accountId }, { $push: { outgoing: { id: req.params.friendId, createdAt: new Date() } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $push: { incoming: { id: req.params.accountId, createdAt: new Date() } } })

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.accountId,
                            to: req.params.friendId,
                            status: "PENDING"
                        }))

                        //
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "PENDING",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
            }
            break;
        case "DELETE":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { accepted: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { accepted: { id: req.params.accountId } } })

                    res.status(204).end()
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { outgoing: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { incoming: { id: req.params.accountId } } })

                    res.status(204).end()
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { incoming: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { outgoing: { id: req.params.accountId } } })

                    res.status(204).end()
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
    }

    //9b5044aff07f4e52af151da6d1fb5bfa
    //71a0b60611cb45d1ac191e03ceebc8c7
})

app.all("/friends/api/public/friends/:accountId/:friendId", async (req, res) => {
    if (req.method != "GET" ? req.method != "POST" ? req.method != "DELETE" : false : false) return res.status(405).json(errors.method("friends", "prod"))
    var friends = await Friends.findOne({ id: req.params.accountId }).lean().catch(e => next(e))

    if (!friends) return res.status(404).json(errors.create(
        "errors.com.epicgames.account.account_not_found", 18007,
        `Sorry, we couldn't find an account for ${req.params.accountId}`,
        "friends", "prod"
    ))

    switch (req.method) {
        case "GET":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.json({
                        accountId: req.params.friendId,
                        groups: [],
                        mutual: 0,
                        alias: "",
                        note: "",
                        favorite: false,
                        created: friends.accepted.find(x => x.id == req.params.friendId).createdAt
                    })
                    break;
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
        case "POST":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} already exists.`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    res.status(409).json(errors.create(
                        "errors.com.epicgames.friends.friend_request_already_sent", 14014,
                        `Friendship request has already been sent to ${req.params.friendId}`,
                        "friends", "prod", [req.params.friendId]
                    ))
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { incoming: { id: req.params.friendId } }, $push: { accepted: { id: req.params.friendId, createdAt: new Date() } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { outgoing: { id: req.params.accountId } }, $push: { accepted: { id: req.params.accountId, createdAt: new Date() } } })

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "ACCEPTED",
                                direction: "OUTBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }

                    if (xmppClients[req.params.accountId]) {
                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.friendId,
                            to: req.params.accountId,
                            status: "ACCEPTED"
                        }))

                        xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.friendId,
                                status: "ACCEPTED",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
                default:
                    await Friends.updateOne({ id: req.params.accountId }, { $push: { outgoing: { id: req.params.friendId, createdAt: new Date() } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $push: { incoming: { id: req.params.accountId, createdAt: new Date() } } })

                    if (xmppClients[req.params.friendId]) {
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            type: "FRIENDSHIP_REQUEST",
                            timestamp: new Date(),
                            from: req.params.accountId,
                            to: req.params.friendId,
                            status: "PENDING"
                        }))

                        //
                        xmppClients[req.params.friendId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                            payload: {
                                accountId: req.params.accountId,
                                status: "PENDING",
                                direction: "INBOUND",
                                created: new Date(),
                                favorite: false
                            },
                            type: "com.epicgames.friends.core.apiobjects.Friend",
                            timestamp: new Date()
                        }))
                    }
                    res.status(204).end()
                    break;
            }
            break;
        case "DELETE":
            switch (true) {
                case friends.accepted.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { accepted: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { accepted: { id: req.params.accountId } } })

                    res.status(204).end()
                    break;
                case friends.outgoing.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { outgoing: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { incoming: { id: req.params.accountId } } })

                    res.status(204).end()
                    break;
                case friends.incoming.find(x => x.id == req.params.friendId) != undefined:
                    await Friends.updateOne({ id: req.params.accountId }, { $pull: { incoming: { id: req.params.friendId } } })
                    await Friends.updateOne({ id: req.params.friendId }, { $pull: { outgoing: { id: req.params.accountId } } })

                    res.status(204).end()
                default:
                    res.status(404).json(errors.create(
                        "errors.com.epicgames.friends.friendship_not_found", 14004,
                        `Friendship between ${req.params.accountId} and ${req.params.friendId} does not exist`,
                        "friends", "prod", [req.params.accountId, req.params.friendId]
                    ))
                    break;
            }
            break;
    }

    //9b5044aff07f4e52af151da6d1fb5bfa
    //71a0b60611cb45d1ac191e03ceebc8c7
})

app.all("/friends/api/v1/:accountId/blocklist", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    res.json([])
})

app.all("/friends/api/v1/:accountId/settings", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    res.json({
        acceptInvites: "public"
    })
})

app.all("/friends/api/v1/:accountId/recent/Fortnite", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))

    res.json([])
})

app.get("/lightswitch/api/service/Fortnite/status", (req, res) => {
    res.json([
        {
            serviceInstanceId: "fortnite",
            status: "UP",
            message: "Fortnite is UP",
            maintenanceUri: null,
            overrideCatalogIds: [
                "a7f138b2e51945ffbfdacc1af0541053"
            ],
            allowedActions: [],
            banned: false,
            launcherInfoDTO: {
                appName: "Fortnite",
                catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
                namespace: "fn"
            }
        }
    ])
})

app.all("/party/api/v1/Fortnite/user/:accountId", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("party", "prod"))
    res.json({ //x => x.members.includes
        current: parties.filter(x => x.members.includes(req.params.accountId)),
        invites: invites.filter(x => x.id == req.params.accountId),
        pending: [],
        pings: pings.filter(x => x.id == req.params.accountId),
    })
})

//create party
app.all("/party/api/v1/Fortnite/parties", (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var yeah = req.body.config && req.body.join_info && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.",
        "party", "prod", [
            req.body.config ? null : "config",
            req.body.meta ? null : "meta",
            req.body.join_info ? null : "join_info"
        ].filter(x => x != null)
    ))


    var party = new Party(req.body.config, req.body.join_info, req.body.meta)

    res.json(party.getPartyInfo())
})

//update party!
app.all("/party/api/v1/Fortnite/parties/:partyId", (req, res) => {
    if (req.method != "PATCH" ? req.method != "GET" ? req.method != "DELETE" ? true : false : false : false) return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    switch (req.method) {
        case "PATCH":

            party.party.updatePartyMeta(req.body.meta.update, req.body.meta.delete)
            res.status(204).send()
            break;
        case "GET":
            return res.json(party.party.getPartyInfo())
            break;
        case "DELETE":
            party.party.deleteParty()
            return res.status(204).end()
            break;
    }
})

//update party member meta
app.all("/party/api/v1/Fortnite/parties/:partyId/members/:accountId/meta", (req, res) => {
    if (req.method != "PATCH") return res.status(405).json(errors.method("party", "prod"))
    var party = parties.find(x => x.id == req.params.partyId)


    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    if (!party.members.includes(req.params.accountId)) return res.status(404).end()

    /*
    if (party.party.members.find(x => x.role == "CAPTAIN").account_id != res.locals.jwt.accountId) return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.member_state_change_forbidden", 51014,
        `The user ${res.locals.jwt.accountId} has no permission to change member state of ${req.params.accountId}`,
        "party", "prod", [res.locals.jwt.accountId, req.params.accountId]
    ))
*/
    party.party.updateUserMeta(req.params.accountId, req.body.update, req.body.delete)
    res.status(204).send()
})


//join party
app.all("/party/api/v1/Fortnite/parties/:partyId/members/:accountId/join", (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("party", "prod"))
    var party = parties.find(x => x.id == req.params.partyId)


    var yeah = req.body.connection && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.",
        "party", "prod", [
            req.body.connection ? null : "connection",
            req.body.meta ? null : "meta",
        ].filter(x => x != null)
    ))

    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    /*
    if (party.party.config != "OPEN") return res.status(403).json(errors.create(
        "errors.com.epicgames.social.party.party_join_forbidden", 51006,
        `The user ${req.params.accountId} has no right to join party ${req.params.partyId}.`,
        "party", "prod", [req.params.accountId, req.params.partyId]
    ))
*/
    party.party.addMember(req.body.connection, req.body.meta)

    res.json({
        status: "JOINED",
        party_id: req.params.partyId
    })
})

//delete member
app.all("/party/api/v1/Fortnite/parties/:partyId/members/:accountId", (req, res) => {
    if (req.method != "DELETE") return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    party.party.removeMember(req.params.accountId)
    res.status(204).end()
})

app.all("/party/api/v1/Fortnite/user/:accountId/pings/", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("party", "prod"))


    res.json(pings.filter(x => x.sent_to == req.params.accountId))
})

app.all("/party/api/v1/Fortnite/user/:accountId/pings/:pingerId/parties", (req, res) => {
    if (req.method != "GET") return res.status(405).json(errors.method("party", "prod"))

    var query = pings.filter(x => x.sent_to == req.params.accountId).filter(x => x.sent_by == req.params.pingerId)
    if (query.length == 0) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.ping_not_found", 51021,
        `Sorry, we couldn't find a ping for user ${req.params.accountId} from ${req.params.pingerId}.`,
        "party", "prod", [req.params.accountId, req.params.pingerId]
    ))

    res.json(query.map(y => {
        var party = parties.find(x => x.members.includes(y.sent_by))
        if (!party) return null; else party = party.party
        return {
            id: party.id,
            created_at: party.createdAt,
            updated_at: party.updatedAt,
            config: party.config,
            members: party.members,
            applicants: [],
            meta: party.meta,
            invites: [],
            revision: party.revision || 0
        }
    }).filter(x => x != null))
})

app.all("/party/api/v1/Fortnite/user/:accountId/pings/:pingerId", (req, res) => {
    if (req.method != "POST" ? req.method != "DELETE" ? true : false : false) return res.status(405).json(errors.method("party", "prod"))


    switch (req.method) {
        case "POST":

            if (pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId))
                pings.splice(pings.findIndex(x => x == pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)), 1)

            pings.push({
                sent_by: req.params.pingerId,
                sent_to: req.params.accountId,
                sent_at: new Date(),
                expires_at: new Date().addHours(1),
                meta: {}
            })

            var ping = pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)

            if (xmppClients[req.params.accountId]) {
                xmppClients[req.params.accountId].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
                    expires: ping.expires_at,
                    meta: {},
                    ns: "Fortnite",
                    pinger_id: req.params.pingerId,
                    sent: ping.sent_at,
                    type: "com.epicgames.social.party.notification.v0.PING"
                }))
            }

            res.json(ping)
            break;
        case "DELETE":
            if (pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId))
                pings.splice(pings.findIndex(x => x == pings.filter(x => x.sent_to == req.params.accountId).find(x => x.sent_by == req.params.pingerId)), 1)
            res.status(204).end()
            break;
    }
})

app.all("/party/api/v1/Fortnite/user/:accountId/pings/:pingerId/join", (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var yeah = req.body.connection && req.body.meta
    if (!yeah) return res.status(400).json(errors.create(
        "errors.com.epicgames.common.json_mapping_error", 1019,
        "Json mapping failed.",
        "party", "prod", [
            req.body.connection ? null : "connection",
            req.body.meta ? null : "meta",
        ].filter(x => x != null)
    ))

    var query = pings.filter(x => x.sent_to == req.params.accountId).filter(x => x.sent_by == req.params.pingerId)
    if (query.length == 0) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.ping_not_found", 51021,
        `Sorry, we couldn't find a ping for user ${rqe.params.accountId} from ${req.params.pingerId}.`,
        "party", "prod", [req.params.accountId, req.params.pingerId]
    ))

    var party = parties.find(x => x.members.includes(query[0].sent_by))

    party.party.addMember(req.body.connection, req.body.meta)

    res.json({
        status: "JOINED",
        party_id: party.id
    })

})

app.all("/party/api/v1/Fortnite/parties/:partyId/members/:accountId/promote", async (req, res) => {
    if (req.method != "POST") return res.status(405).json(errors.method("party", "prod"))

    var party = parties.find(x => x.id == req.params.partyId)
    if (!party) return res.status(404).json(errors.create(
        "errors.com.epicgames.social.party.party_not_found", 51002,
        `Sorry, we couldn't find a party by id ${req.params.partyId}`,
        "party", "prod", [req.params.partyId]
    ))

    party.party.setPartyLeader(req.params.accountId)
    res.status(204).end()

})

app.all("/lightswitch/api/service/bulk/status", (req, res) => {
    res.json([
        {
            serviceInstanceId: "fortnite",
            status: "UP",
            message: "Fortnite is UP",
            maintenanceUri: null,
            overrideCatalogIds: [
                "a7f138b2e51945ffbfdacc1af0541053"
            ],
            allowedActions: [],
            banned: false,
            launcherInfoDTO: {
                appName: "Fortnite",
                catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
                namespace: "fn"
            }
        }
    ])
})

app.get('/api/public/account/:accountId/externalAuths', (req, res) => res.json({}))

app.all("/account/api/public/account/:accountId/externalAuths", (req, res) => res.json({}))

app.all("/account/api/oauth/verify", CheckT, (req, res, next) => {
    var token = accessTokens.find(x => x.token == req.headers.authorization.split(" ")[1])

    if (token) {
        res.json({
            access_token: token.token,
            expires_in: 28800,
            expires_at: new Date().addHours(8),
            token_type: "bearer",
            refresh_token: token.token,
            refresh_expires: 115200,
            refresh_expires_at: new Date().addHours(32),

            client_id: "test",
            internal_client: true,
            client_service: "fortnite",
            scope: [],
            displayName: res.locals.jwt.displayName,
            app: "fortnite",
            in_app_id: res.locals.jwt.accountId
        })
    } else next()
})

app.all("/datarouter/api/v1/public/data", (req, res) => res.status(204).end())

app.get("/waitingroom/api/waitingroom", (req, res) => res.status(204).end())

app.get("/fortnite/api/v2/versioncheck/Windows", (req, res) => {
    res.json({ type: "NO_UPDATE" })
})

app.get("/api/pages/fortnite-game", async (req, res) => {
    var season
    if (req.headers["user-agent"]) {
        try {
            season = req.headers["user-agent"].split("-")[1].split(".")[0]
            if (season == 10) season = "x"
        } catch {
            season = 2
        }
    } else season = 2

    res.json({
        "jcr:isCheckedOut": true,
        _title: "Fortnite Game",
        "jcr:baseVersion": "a7ca237317f1e7883b3279-c38f-4aa7-a325-e099e4bf71e5",
        _activeDate: "2017-08-30T03:20:48.050Z",
        lastModified: new Date(),
        _locale: "en-US",
        battleroyalenewsv2: {
            news: {
                motds: [
                    {
                        entryType: "Website",
                        image: "https://media.discordapp.net/attachments/835302046592270446/847286989123485706/3.png",
                        tileImage: "https://media.discordapp.net/attachments/835302046592270446/847286989123485706/3.png",
                        hidden: false,
                        videoMute: false,
                        tabTitleOverride: "Project Cloud",
                        _type: "CommonUI Simple Message MOTD",
                        body: "Welcome to CloudFN V2",
                        title: "Cloud V2",
                        videoLoop: false,
                        videoStreamingEnabled: false,
                        sortingPriority: 0,
                        id: `Cloud-News-0`,
                        spotlight: false,
                        websiteURL: "https://cloudfn.dev",
                        websiteButtonText: "CloudFN Website"
                    }
                ]
            },
            "jcr:isCheckedOut": true,
            "_title": "battleroyalenewsv2",
            "header": "",
            "style": "None",
            "_noIndex": false,
            "alwaysShow": true,
            "jcr:baseVersion": "a7ca237317f1e704b1a186-6846-4eaa-a542-c2c8ca7e7f29",
            "_activeDate": "2020-01-21T14:00:00.000Z",
            "lastModified": "2021-02-10T23:57:48.837Z",
            "_locale": "en-US"
        },
        emergencynoticev2: {
            news: {
                platform_messages: [],
                _type: "Battle Royale News",
                messages: [
                    {
                        hidden: false,
                        _type: "CommonUI Simple Message Base",
                        subgame: "br",
                        body: "Welcome to CloudFN V2",
                        title: "Cloud V2",
                        spotlight: true
                    }
                ]
            },
            _title: "emergencynotice",
            _activeDate: new Date(),
            lastModified: new Date(),
            _locale: "en-US"
        },
        dynamicbackgrounds: {
            "jcr:isCheckedOut": true,
            backgrounds: {
                backgrounds: [
                    {
                        stage: `season${season}`,
                        _type: "DynamicBackground",
                        key: "lobby"
                    },
                    {
                        stage: `season${season}`,
                        _type: "DynamicBackground",
                        key: "vault"
                    }
                ],
                "_type": "DynamicBackgroundList"
            },
            _title: "dynamicbackgrounds",
            _noIndex: false,
            "jcr:baseVersion": "a7ca237317f1e71f17852c-bccd-4be6-89a0-1bb52672a444",
            _activeDate: new Date(),
            lastModified: new Date(),
            _locale: "en-US"
        }
    })
})

app.get("/fortnite/api/receipts/v1/account/:accountId/receipts", (req, res) => {
    res.json({})
})

app.post("/fortnite/api/game/v2/tryPlayOnPlatform/account/:accountId", (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send(true)
})

app.get("/fortnite/api/game/v2/enabled_features", (req, res) => {
    res.json([])
})

app.get("/fortnite/api/storefront/v2/keychain", (req, res) => {
    res.json(JSON.parse(fs.readFileSync(`${__dirname}/../cloud_data/other/keychain.json`)))
})

app.all("/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId", (req, res) => {
    res.status(204).end()
})

app.all("/fortnite/api/game/v2/privacy/account/:accountId", (req, res) => {
    res.json({ acceptInvites: "public" })
})

module.exports = app
