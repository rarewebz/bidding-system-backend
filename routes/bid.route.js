/**
 * This route will manage auction's routes
 */
const config = require('../config/config')
const express = require('express')
const UserModel = require('../models/user.model')
const BidModel = require('../models/bid.model')
const AuctionModel = require('../models/auction.model')
const router = express.Router()

const getUser = async (req, res, next) => {
    console.log('Get User Middleware')
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

const getAuction = async (req, res, next) => {
    console.log('Get Auction Middleware')
    let auction
    try {
        auction = await AuctionModel.findById(req.params.id)
        if(auction == null) {
            return res.status(404).json({message: "Auction not found"})
        }
    } catch(e) {
        return res.status(500).json({message: e.message})
    }
    res.auction = auction
    next()
}

router.post('/auction/:id', getUser, getAuction, async (req, res) => {

    console.log('res: ', res)

    try {
        if(res.auction.ownerId === res.user._id)
            res.json({
                success: false,
                body: null,
                message: "Auction owner can't bid"
            })
        const bid = new BidModel({
            auctionId: req.params.id,
            userId: req.body.userId,
            username: res.user.firstname,
            bid: req.body.bid
        })
        const result = await bid.save()
        res.json({
            success: true,
            body: null,
            message: 'Bid saved successfully!'
        })
    } catch (e) {
        console.log(e)
        res.status(400).json({
            success: false,
            message: 'Invalid inputs.'
        })
    }
})

module.exports =  router
