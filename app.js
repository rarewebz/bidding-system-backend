// ---- config .env ----
const {ObjectId} = require("bson")

require('dotenv').config()
const cors = require('cors')
const http = require("http")
const { Storage } = require('megajs')

// ---- import express ----
const express =  require('express')
const app = express()
app.use(express.json())

// ---- import socket.io ----
let server = http.createServer(app);
const io = require('socket.io')(server,{
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true
    },
});

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

// require('./routes/io-handler')(io);

let CURRENT_CHANNELS = [
    // {
    //     name: 'Funny',
    //     participants: 0,
    //     id: '10000',
    //     sockets: []
    // }
]

const AuctionModal = require('./models/auction.model')
const UserModal = require('./models/user.model')
const bidModel = require('./models/bid.model')

io.on('connection', (socket) => { // socket object may be used to send specific messages to the new connected client
    console.log('new client connected');

    // Connection
    socket.emit('connection', null);

    // Join to the auction
    socket.on('channel-join', async data => {

        let id = data.auctionId
        let userId = data.userId

        console.log('0000000000000000000000 UserId: ', userId)

        const user = await UserModal.findById(userId)

        console.log('0000000000000000000000 User: ', user)

        let result = await CURRENT_CHANNELS.findIndex(e => e.id == id)

        if(result < 0) {

            console.log('channel join - 1: ', socket.id);
            console.log('channel join - 2: ', id);
            const result = await AuctionModal.findById(id)
            console.log('ooooooooooooooooooooo 1: ', result)
            if(result) {

                console.log('ooooooooooooooooooooo: ', result)

                let sockets = []
                sockets.push(
                    {
                        user: JSON.parse(JSON.stringify(user)),
                        socket: socket.id
                    }
                )
                let newChannel = {
                    name: result.name,
                    participants: 1,
                    id: result._id,
                    sockets: sockets
                }
                CURRENT_CHANNELS.push(newChannel)
                io.emit('channel', newChannel)
            }

        } else {

            console.log('channel join - 2: ', socket.id);
            console.log('channel join - 3U: ', user);
                CURRENT_CHANNELS.forEach(c => {
                                if (c.id == id) {
                                    console.log("socket: ", socket.id)
                                    console.log("socket idx: ", c.sockets.indexOf(socket.id))
                                    if (c.sockets.indexOf(socket.id) == (-1)) {
                                        c.sockets.push(
                                            {
                                                user: JSON.parse(JSON.stringify(user)),
                                                socket: socket.id
                                            }
                                        );
                                        c.participants++;
                                        io.emit('channel', c);
                                    }
                                }
                })

        }


        // CURRENT_CHANNELS.forEach(async c => {
        //     if (c.id === id) {
        //         console.log("socket: ", socket.id)
        //         if (c.sockets.indexOf(socket.id) == (-1)) {
        //             c.sockets.push(socket.id);
        //             c.participants++;
        //             io.emit('channel', c);
        //         }
        //     } else {
        //         const result = await AuctionModal.findById(id)
        //         if(result) {
        //             let sockets = []
        //             sockets.push(socket.id)
        //             let newChannel = {
        //                 name: result.name,
        //                 participants: 1,
        //                 id: result._id,
        //                 sockets: sockets
        //             }
        //             CURRENT_CHANNELS.push(newChannel)
        //             io.emit('channel', newChannel)
        //         }
        //         let index = c.sockets.indexOf(socket.id);
        //         if (index != (-1)) {
        //             c.sockets.splice(index, 1);
        //             c.participants--;
        //             io.emit('channel', c);
        //         }
        //     }
        // });

        return id;
    });

    socket.on('bid', async message => {

        console.log("------------------->> message: ", message)

        let channel = await CURRENT_CHANNELS.findIndex(e => e.id == message.channelId)
        let existingBid = await bidModel.findOne({auctionId: message.channelId, bid: message.amount})

        console.log("------------------->> ", existingBid)
        console.log("------------------->> CF: ", CURRENT_CHANNELS)

        // const value = await bidModel.find().sort({bid: -1}).limit(1)
        //
        // console.log("------------------------>>>>>> val: ", value)
        //
        // if(value) {
        //     const bidv = value[0].bid
        //     if(bidv > message.amount) {
        //         let bidResponse = {
        //             success: false,
        //             message: "Sorry! Your bid value is less than latest bid value"
        //         }
        //         let socketArr = [message.socketId]
        //         io.sockets.in(socketArr).emit('bid-listener', bidResponse);
        //     }
        // }

        if(!existingBid) {

            let ch_idx = await CURRENT_CHANNELS.findIndex(e => e.id == message.channelId)

            console.log("------------------->> ch_idx: ", ch_idx)

            let user_idx = await CURRENT_CHANNELS[ch_idx].sockets.findIndex(e => e.socket == message.socketId)

            console.log("------------------->> user_idx: ", user_idx)
            console.log("------------------->> UU: ", CURRENT_CHANNELS)
            console.log("------------------->> UU2: ", CURRENT_CHANNELS[ch_idx].sockets[user_idx])

            let userId = CURRENT_CHANNELS[ch_idx].sockets[user_idx].user._id

            console.log("------------------->> userId: ", userId)

            let username = CURRENT_CHANNELS[ch_idx].sockets[user_idx].user.firstname

            console.log("------------------->> username: ", username)

            console.log('UserId: ', userId)

            let bid = new bidModel({
                auctionId: message.channelId,
                userId: userId,
                username: username,
                bid: message.amount
            })

            console.log("------------------->> bid: ", bid)

            await bid.save()
            let socketArr = await CURRENT_CHANNELS[channel]?.sockets.map(v => (v.socket))
            let bidResponse = {
                success: true,
                data: {
                    username: username,
                    bid: message.amount,
                    biddate: new Date()
                }
            }
            io.sockets.in(socketArr).emit('bid-listener', bidResponse);

        } else {
            let bidResponse = {
                success: false,
                message: "Sorry! This bid already exist"
            }
            let socketArr = [message.socketId]
            io.sockets.in(socketArr).emit('bid-listener', bidResponse);
        }

    });

    socket.on('disconnect', () => {
        CURRENT_CHANNELS.forEach(c => {
            let index = c.sockets.findIndex(e => e.socket == socket.id);
            if (index != (-1)) {
                c.sockets.splice(index, 1);
                c.participants--;
                io.emit('channel', c);
            }
        });
    });

});



// let storage
// (async function () {
//      storage = new Storage({
//         email: process.env.MEGA_USERNAME,
//         password: process.env.MEGA_PASSWORD,
//         userAgent: 'ExampleClient/1.0'
//     })
//
//     // Will resolve once the user is logged in
//     // or reject if some error happens
//     await storage.ready
// }()).catch(error => {
//     console.error(error)
//     process.exit(1)
// })
//
// storage.once('ready', () => {
//     // User is now logged in
//     console.log('Logged to the MEGA Cloud Successfully!')
//     storage.upload('hello-world.txt', 'Hello world!', async (error, file) => {
//         if (error) return console.error('There was an error:', error)
//         console.log('The file was uploaded!')
//         let link = await file.link()
//         console.log('The file was uploaded! -> ', link)
//     })
//
// })
//
// storage.once('error', error => {
//     // Some error happened
//     console.log('Unable to Log to the MEGA Cloud, error: ', error)
// })


setInterval(async () => {
    const endAuctions = await AuctionModal.find({status: {$ne: 'DELETED'}, enddate: {$lt: Date.now()}, winnerId: {$exists: false}})
    endAuctions.map(async a => {
        let max = await bidModel.find({auctionId: a._id}).sort({biddate: -1}).limit(1)
        // console.log("Fire ---->", max)
        if(max.length > 0) {
            // console.log("Fire ---->")
            await AuctionModal.updateOne({_id: ObjectId(a._id)}, {$set: {winnerId: max[0].userId}})
            await AuctionModal.updateOne({_id: ObjectId(a._id)}, {$set: {status: 'ENDED'}})
        }
    })
}, 15000);





// ---- start the server ----
server.listen(3000, () => {
    console.log("Backend server started...")
})
