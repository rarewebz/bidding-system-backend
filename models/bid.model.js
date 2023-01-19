const mongoose =  require('mongoose')
const { Decimal128 } = require('bson')

const bidSchema = new mongoose.Schema({
    auctionId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    bid: {
        type: Decimal128,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('bid', bidSchema)
