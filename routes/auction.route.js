/**
 * This route will manage auction's routes
 */
const config = require('../config/config')
const express = require('express')
const AuctionModel = require('../models/auction.model')
const BidModel = require('../models/bid.model')
const UserModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const { ObjectId } = require('bson')
const router = express.Router()


const getHeaderFromToken = (req, res, next) => {
    const token = req.headers.authorization;
    if(!token) res.status(401).json('Invalid token.')
    const data = jwt.verify(token.split(" ")[1], config.ACCESS_TOKEN_SECRET);
    if(!data) res.status(401).json('Invalid token.')
    res.tokendata = data
    next()
}

const getAuctionData = async (req, res, next) => {
    let auction
    try {
        console.log('Auction: ', req.params.id)
        auction = await AuctionModel.findById(req.params.id)
        console.log('Auction Data: ', auction)
        if(!auction) res.status(200).json({
            success: false,
            message: 'Auction not found'
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
    res.auction = auction
    next()
}

router.post('/', getHeaderFromToken, async (req, res) => {
    try {
        if(!res.tokendata.username) res.status(401).json('Invalid token.')
        const user = await UserModel.findOne({email: res.tokendata.username})
        if(!user) res.status(200).json({
            success: false,
            message: 'User not found.'
        })

        const body = req.body
        const auction = new AuctionModel({
            name: body.name,
            initialprice: body.initialprice,
            startdate: body.startdate,
            enddate: body.enddate,
            description: body.description,
            images: body.images,
            ownerId: user._id,
            winnerId: body.winnerId,
            status: 'ACTIVE'
        })
        const result = await auction.save()
        res.json({
            success: true,
            body: {auction: result},
            message: 'Auction saved successfully!'
        })
    } catch (e) {
        console.log(e)
        res.status(400).json({
            success: false,
            message: 'Invalid inputs'
        })
    }
})

router.get('/', async (req, res) => {
    try {
        const upcoming = await AuctionModel.find({status: {$ne: 'DELETED'}, startdate: {$gt: Date.now()}})
        const ongoing = await AuctionModel.find({status: {$ne: 'DELETED'}, startdate: {$lte: Date.now()}, enddate: {$gte: Date.now()}})
        const end = await AuctionModel.find({status: {$ne: 'DELETED'}, enddate: {$lt: Date.now()}})
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

router.post('/images/:id', getAuctionData, async (req, res) => {
    try {
        const imageArr = []
        req.body.images.forEach((image, index) => {
            let base64Image = image.split(';base64,').pop();
            let imageFile = `${res.auction._id}_${index}.${image.match(/[^:/]\w+(?=;|,)/)[0]}`
            imageArr.push(imageFile)
            fs.writeFile(`public/images/${imageFile}`, base64Image, {encoding: 'base64'}, function(err) {
                if(err) {
                    console.error(err)
                }
            })
        })
        res.auction.images = imageArr
        const result = await AuctionModel.update({_id: ObjectId(res.auction._id)}, {$set: {images: imageArr}})
        res.json({
            success: true,
            body: null,
            message: 'Auction item images saved successfully!'
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

module.exports =  router
