// ---- config .env ----
require('dotenv').config()

// ---- import express ----
const express =  require('express')
const app = express()
app.use(express.json())

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



// ---- start the server ----
app.listen(3000, () => {
    console.log("Backend server started...")
})