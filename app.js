// ---- config .env ----
require('dotenv').config()
const cors = require('cors')

// ---- import express ----
const express =  require('express')
const app = express()
app.use(express.json())

const fileUpload = require('express-fileupload')
app.use(fileUpload())
app.use(express.static('public'))
app.use(cors({
    origin: '*'
}))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT, DELETE")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    next()
})

// ---- import mongooes ----
const mongoose = require('mongoose')
// connect to the mongodb
mongoose.connect(process.env.DB_URL, {useNewUrlParser: true})
// get connection
const db = mongoose.connection
// catch db connecting errors
db.on('error', (error) => console.error(error))
// detect db connecting when complete
db.on('open', () => console.log('Connected to the database successfully!'))

// ---- import routes ----
// user router
const userRouter = require('./routes/user.route')
app.use('/user', userRouter)
// auction router
const auctionRouter = require('./routes/auction.route')
app.use('/auction', auctionRouter)
// bid router
const bidRouter = require('./routes/bid.route')
app.use('/bid', bidRouter)
// my router
const myRouter = require('./routes/my.route')
app.use('/my', myRouter)

// ---- start the server ----
app.listen(3000, () => {
    console.log("Backend server started...")
})
