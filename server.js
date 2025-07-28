const express = require('express');
const app = express()
const http = require('http');
const path = require("path");
const {Server} = require("socket.io")
const server = http.createServer(app)

const io = new Server(server , {
    cors: {
        origin: ["http://localhost:3000", "https://audio-call.vercel.app"],  
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"]
    }
})



io.on("connection", async (socket) =>{
    socket.on("join-call",call_id => {
        socket.join(call_id)
        socket.to(call_id).emit("new-socket",socket.id)
    })

    socket.on("offer",data => {
        socket.to(data.to).emit("recive-offer",{"from":socket.id,"offer":data.offer})
    })

    socket.on("answer",data => {
        socket.to(data.to).emit("recive-answer",{"from":socket.id,"answer":data.answer})
    })

    socket.on("icecandidate",data => {
        socket.to(data.to).emit("recive-icecandidate",{"from":socket.id,"candidate":data.candidate})
    })

})



app.use(express.static(path.join(__dirname,"public")))





server.listen(3000, () => console.log('Server running on port 3000'));