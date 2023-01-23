const mongoose =  require('mongoose')
const { Decimal128 } = require('bson')

const auctionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    initialprice: {
        type: Decimal128,
        required: true
    },
    startdate: {
        type: Date,
        required: true
    },
    enddate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    ownerId: {
        type: String,
        required: true
    },
    winnerId: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    ownerstatus: {
        type: String,
        enum: ['SENT'],
        required: false
    },
    bidderstatus: {
        type: String,
        enum: ['CLAIMED'],
        required: false
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED', 'ENDED', 'CLOSED'],
        required: true,
        default: 'ACTIVE'
    }
})

module.exports = mongoose.model('auction', auctionSchema)
