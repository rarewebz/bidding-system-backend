/**
 * This route will manage auction's routes
 */
const config = require('../config/config')
const express = require('express')
const UserModel = require('../models/user.model')
const BidModel = require('../models/bid.model')
const router = express.Router()

const getUser = async (req, res, next) => {
    let user
    try {
        user = await UserModel.findById(req.body.userId)
        if(user == null) {
            return res.status(404).json({message: "User not found"})
        }
    } catch(e) {
        return res.status(500).json({message: e.message})
    }
    res.user = user
    next()
}

router.get('/auction/:id', getUser, async (req, res) => {
    try {
        const bid = new BidModel({
            auctionId: req.params.status,
            userId: req.body.userId,
            username: res.user.username,
            bid: req.body.bid
        })
        const result = await bid.save()
        res.json({
            success: true,
            body: null,
            message: 'Bid saved successfully!'
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Invalid inputs.'
        })
    }
})

module.exports =  router
