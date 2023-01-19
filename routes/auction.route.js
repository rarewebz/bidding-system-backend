/**
 * This route will manage auction's routes
 */
const config = require('../config/config')
const express = require('express')
const AuctionModel = require('../models/auction.model')
const BidModel = require('../models/bid.model')
const router = express.Router()

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

router.post('/', async (req, res) => {
    try {
        const body = req.body
        const auction = new AuctionModel({
            name: body.name,
            initialprice: body.initialprice,
            startdate: body.startdate,
            enddate: body.enddate,
            description: body.description,
            images: body.images,
            ownerId: body.ownerId,
            winnerId: body.winnerId,
            status: 'ACTIVE'
        })
        const result = await auction.save()
        res.json({
            success: true,
            body: null,
            message: 'Auction saved successfully!'
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Invalid inputs'
        })
    }
})

router.get('/', async (req, res) => {
    try {
        const upcoming = await AuctionModel.find({status: {$not: 'DELETED'}, startdate: {$gt: Date.now()}})
        const ongoing = await AuctionModel.find({status: {$not: 'DELETED'}, startdate: {$gte: Date.now()}, enddate: {$lte: Date.now()}})
        const end = await AuctionModel.find({status: {$not: 'DELETED'}, enddate: {$lt: Date.now()}})
        const responseBody = {
            upcoming,
            ongoing,
            end
        }
        res.json({
            success: true,
            body: responseBody,
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
