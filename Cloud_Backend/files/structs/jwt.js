const jwt = require("jsonwebtoken")
const crypto = require("crypto")

module.exports = {
    createNormal(grantType, accountId, displayName, clientId) {
        return jwt.sign({
            app: "fortnite",
            sub: accountId,
            mver: false,
            clid: clientId,
            dn: displayName,
            am: grantType,
            p: crypto.randomBytes(256).toString("base64"),
            iai: accountId,
            clsvc: "fortnite",
            t: "s",
            ic: true,
            exp: Math.floor(Date.now() / 1000) + (480 * 480),
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(32).toString("hex")
        }, "cloud")
    },

    createRefresh(grantType, accountId, clientId) {
        return jwt.sign({
            sub: accountId,
            t: "r",
            clid: clientId,
            exp: Math.floor(Date.now() / 1000) + (1920 * 1920),
            am: grantType,
            jti: crypto.randomBytes(32).toString("hex")
        }, "cloud")
    },

    createClient(clientId) {
        return jwt.sign({
            p: crypto.randomBytes(128).toString("base64"),
            clsvc: "fortnite",
            t: "s",
            mver: false,
            clid: clientId,
            ic: true,
            exp: Math.floor(Date.now() / 1000) + (240 * 240),
            am: "client_credentials",
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(32).toString("hex")
        }, "cloud")
    }
}
