const mongoose = require("mongoose")
const crypto = require("crypto")

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    incoming: {
        type: Array,
        default: []
    },
    outgoing: {
        type: Array,
        default: []
    },
    accepted: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model("friends", schema)