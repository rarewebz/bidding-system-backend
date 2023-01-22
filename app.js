// ---- config .env ----
require('dotenv').config()
const cors = require('cors')
const http = require("http")

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

var STATIC_CHANNELS = [{
    name: 'Global chat',
    participants: 0,
    id: 1,
    sockets: []
}, {
    name: 'Funny',
    participants: 0,
    id: 2,
    sockets: []
}];

let CURRENT_CHANNELS = [
    {
        name: 'Funny',
        participants: 0,
        id: '10000',
        sockets: []
    }
]

// io.on('connection', (socket) => { // socket object may be used to send specific messages to the new connected client
//     console.log('new client connected');
//     socket.emit('connection', null);
//     socket.on('channel-join', id => {
//         console.log('channel join', id);
//         STATIC_CHANNELS.forEach(c => {
//             if (c.id === id) {
//                 if (c.sockets.indexOf(socket.id) == (-1)) {
//                     c.sockets.push(socket.id);
//                     c.participants++;
//                     io.emit('channel', c);
//                 }
//             } else {
//                 let index = c.sockets.indexOf(socket.id);
//                 if (index != (-1)) {
//                     c.sockets.splice(index, 1);
//                     c.participants--;
//                     io.emit('channel', c);
//                 }
//             }
//         });
//
//         return id;
//     });
//     socket.on('send-message', message => {
//         io.emit('message', message);
//     });
//
//     socket.on('disconnect', () => {
//         STATIC_CHANNELS.forEach(c => {
//             let index = c.sockets.indexOf(socket.id);
//             if (index != (-1)) {
//                 c.sockets.splice(index, 1);
//                 c.participants--;
//                 io.emit('channel', c);
//             }
//         });
//     });
//
// });


const AuctionModal = require('./models/auction.model')

io.on('connection', (socket) => { // socket object may be used to send specific messages to the new connected client
    console.log('new client connected');
    socket.emit('connection', null);

    socket.on('channel-join', async data => {
        let id = data.auctionId
        let userId = data.userId
        console.log('channel join', id);
        let result = await CURRENT_CHANNELS.findIndex(e => e.id == id)
        if(result < 0) {
            console.log('channel join - 1: ', socket.id);
            const result = await AuctionModal.findById(id)
            if(result) {
                let sockets = []
                sockets.push(socket.id)
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
                CURRENT_CHANNELS.forEach(c => {
                                if (c.id == id) {
                                    console.log("socket: ", socket.id)
                                    console.log("socket idx: ", c.sockets.indexOf(socket.id))
                                    if (c.sockets.indexOf(socket.id) == (-1)) {
                                        c.sockets.push(socket.id);
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
        let channel = await CURRENT_CHANNELS.findIndex(e => e.id == message.channel_id)
        console.log("CURRENT_CHANNELS[channel]?.sockets: ", CURRENT_CHANNELS[channel]?.sockets)
        io.sockets.in(CURRENT_CHANNELS[channel]?.sockets).emit('bid-listener', message);
    });

    socket.on('disconnect', () => {
        STATIC_CHANNELS.forEach(c => {
            let index = c.sockets.indexOf(socket.id);
            if (index != (-1)) {
                c.sockets.splice(index, 1);
                c.participants--;
                io.emit('channel', c);
            }
        });
    });

});

// ---- start the server ----
server.listen(3000, () => {
    console.log("Backend server started...")
})
