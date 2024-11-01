/////////////////////////////////////////////////////////////////
/*
  Broadcasting Your Voice with ESP32-S3 & INMP441
  For More Information: https://youtu.be/qq2FRv0lCPw
  Created by Eric N. (ThatProject)
*/
/////////////////////////////////////////////////////////////////
/*
const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const app = express();

const WS_PORT = process.env.WS_PORT || 10000;
// const HTTP_PORT = process.env.HTTP_PORT || 10001 ;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () =>
  console.log(`WS server is listening at ws://localhost:${WS_PORT}`)
);

// array of connected websocket clients
let connectedClients = [];

wsServer.on("connection", (ws, req) => {
  console.log("Connected");
  // add new connected client
  connectedClients.push(ws);
  // listen for messages from the streamer, the clients will not send anything so we don't need to filter
  ws.on("message", (data) => {
    connectedClients.forEach((ws, i) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else {
        connectedClients.splice(i, 1);
      }
    });
  });
});
*/

// HTTP stuff
// app.use("/image", express.static("image"));
// app.use("/js", express.static("js"));
// app.get("/audio", (req, res) =>
//   res.sendFile(path.resolve(__dirname, "./audio_client.html"))
// );
// app.listen(HTTP_PORT, () =>
//   console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`)
// );
const fs = require('fs');
const WebSocket = require('ws');

// ตั้งค่า URL ของ WebSocket server
const ws = new WebSocket('wss://nodejs-websocket-ipke.onrender.com');
const filePath = 'pcm3244s.wav';
const BUFFER_SIZE = 1024; // ขนาด buffer ของข้อมูลเสียง (ปรับค่าได้ตามต้องการ)
const INTERVAL = 50; // กำหนดช่วงเวลาในการส่งข้อมูล (มิลลิวินาที)

// ฟังก์ชันที่ใช้ส่งไฟล์เสียงแบบเว้นช่วง
function sendAudioLoop() {
    const readStream = fs.createReadStream(filePath, { highWaterMark: BUFFER_SIZE });
    let bufferQueue = [];

    // เมื่ออ่านข้อมูลเข้ามาให้เก็บไว้ใน bufferQueue
    readStream.on('data', (chunk) => {
        bufferQueue.push(chunk);
    });

    readStream.on('end', () => {
        console.log('Finished sending file, restarting...');
        sendAudioLoop(); // วนลูปไฟล์ใหม่เมื่ออ่านจบ
    });

    readStream.on('error', (err) => {
        console.error('Error reading file:', err);
    });

    // ส่งข้อมูลจาก bufferQueue ตาม INTERVAL ที่กำหนด
    const sendInterval = setInterval(() => {
        if (bufferQueue.length > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(bufferQueue.shift()); // ส่ง chunk แรกใน bufferQueue
        } else if (bufferQueue.length === 0 && readStream.readableEnded) {
            clearInterval(sendInterval); // หยุด interval เมื่ออ่านไฟล์จบ
        }
    }, INTERVAL);
}

// เมื่อ WebSocket เชื่อมต่อสำเร็จ
ws.on('open', () => {
    console.log('WebSocket connected');
    sendAudioLoop(); // เริ่มการส่งไฟล์เสียงแบบวนลูป
});

ws.on('close', () => {
    console.log('WebSocket disconnected');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

