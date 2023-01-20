/**
 * This route will manage user's routes
 */
const config = require('../config/config')
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/user.model')
const router = express.Router()
const tokenList = {}

const prepareUserObject = async (req, res, next) => {
    console.log('-----------------> 1')
    let newUser
    try {
        const {firstname, lastname, email, password} = req.body;
        const user = await UserModel.findOne({email})
        if (user) {
            return res.status(200).json({
                success: false,
                message: 'Email already exists! Please user another email'
            })
        } else {
            newUser = await bcrypt.hash(password, 8, function (err, hash) {
                const newUser = new UserModel({
                    firstname,
                    lastname,
                    email,
                    password: hash
                })
                res.newUser = newUser
                next()
            })
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
}

router.post('/auth', async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await UserModel.findOne({email: email})
        console.log('--------> user: ', user)
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'Incorrect email!1'
            })
        } else {
            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) {
                // Access Token
                let accessToken = jwt.sign(
                    {
                        username: user.email,
                        lastLogoutTime: user.date,
                        role: 'user'
                    },
                    config.ACCESS_TOKEN_SECRET,
                    {expiresIn: '1d'}
                )
                // Refresh Token
                const refreshToken = jwt.sign({
                        username: user.email,
                        lastLogoutTime: user.date,
                        role: 'user'
                    }, config.REFRESH_TOKEN_SECRET,
                    {expiresIn: config.REFRESH_TOKEN_LIFE}
                )
                const response = {
                    success: true,
                    user: {
                        id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        date: user.date
                    },
                    access_token: accessToken,
                    refresh_token: refreshToken
                }

                tokenList[refreshToken] = response
                res.json(response)
            } else {
                logger.info('Authentication Failed!')
                res.json({
                    success: false,
                    message: 'Incorrect Password!'
                })
            }
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

router.post('/refresh', (req,res) => {
    // refresh the damn token
    const refreshToken = req.body.refreshToken
    // if refresh token exists
    if((refreshToken) && (refreshToken in tokenList)) {
        const user = {
            "email": postData.email,
            "name": postData.name
        }
        const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife})
        const response = {
            "token": token,
        }
        // update the token in the list
        tokenList[postData.refreshToken].token = token
        res.status(200).json(response);
    } else {
        res.status(404).send('Invalid request')
    }
})

router.post('/create', prepareUserObject, async (req, res) => {
    console.log('Router: call create user')
    try {
            const newUser = res.newUser
        console.log('----------------->', newUser)
            const savedUser = await newUser.save()
            res.json({
                success: true,
                body: null,
                message: "User created successfully!"
            })
    } catch (e) {
        console.log(e)
        res.status(500).json({
            success: false,
            message: 'Error occurred. Please try again.'
        })
    }
})

module.exports = router
