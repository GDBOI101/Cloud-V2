const mongoose = require("mongoose")
const crypto = require("crypto")

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    vbucks: {
        type: Number,
        default: 2147483647
    },
    mtxplatform: {
        type: String,
        default: "EpicPC"
    },
    gifts: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model("commoncore", schema)