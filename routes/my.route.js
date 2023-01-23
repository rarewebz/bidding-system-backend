/**
 * This route will manage auction's routes
 */
const config = require('../config/config')
const express = require('express')
const AuctionModel = require('../models/auction.model')
const BidModel = require('../models/bid.model')
const UserModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const router = express.Router()

const getHeaderFromToken = (req, res, next) => {
    const token = req.headers.authorization;
    if(!token) res.status(401).json('Invalid token.')
    const data = jwt.verify(token.split(" ")[1], config.ACCESS_TOKEN_SECRET);
    if(!data) res.status(401).json('Invalid token.')
    res.tokendata = data
    next()
}

const getAuction = async (req, res, next) => {
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

router.get('/auctions', getHeaderFromToken, async (req, res) => {
    try {
        if(!res.tokendata.username) res.status(401).json('Invalid token.')
        const user = await UserModel.findOne({email: res.tokendata.username})
        if(!user) res.status(200).json({
            success: false,
            message: 'User not found.'
        })
        const result = await AuctionModel.find({ownerId: user._id})
        res.json({
            success: true,
            body: result,
            message: ''
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

router.get('/won', getHeaderFromToken, async (req, res) => {
    try {
        if(!res.tokendata.username) res.status(401).json('Invalid token.')
        const user = await UserModel.findOne({email: res.tokendata.username})
        if(!user) res.status(200).json({
            success: false,
            message: 'User not found.'
        })
        const result = await AuctionModel.find({ownerId: user._id})
        res.json({
            success: true,
            body: result,
            message: ''
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

router.get('/:id/bids', async (req, res) => {
    try {
        const bids = await BidModel.find({auctionId: req.params.id})
        res.json({
            success: true,
            body: bids,
            message: ''
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

router.post('/:id', getAuction, async (req, res) => {
    try {
        res.auction.images = req.body.images
        const result = await res.auction.save()
        res.json({
            success: true,
            body: null,
            message: 'Auction item images saved successfully!'
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})


router.get('/claims/:type', getHeaderFromToken, async (req, res) => {
    try {
        if(!res.tokendata.username) res.status(401).json('Invalid token.')
        const user = await UserModel.findOne({email: res.tokendata.username})
        if(!user) res.status(200).json({
            success: false,
            message: 'User not found.'
        })
        const type = req.params.type
        if(type === "bidder") {
            const auctions = await AuctionModel.find({winnerId: user._id, bidderstatus: {$exists: false}})
            res.json({
                success: true,
                body: auctions,
                message: ''
            })
        } else {
            const auctions = await AuctionModel.find({winnerId: user._id, ownerstatus: {$exists: false}})
            res.json({
                success: true,
                body: auctions,
                message: ''
            })
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

module.exports =  router
