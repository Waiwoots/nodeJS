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
const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const app = express();

const WS_PORT = process.env.WS_PORT || 10000;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () =>
  console.log(`WS server is listening at ws://localhost:${WS_PORT}`)
);

// Array ของ clients ที่เชื่อมต่อ
let connectedClients = [];

// ใช้ buffer queue สำหรับเก็บข้อมูลที่ได้รับจาก streamer ก่อนส่ง
let bufferQueue = [];
const BUFFER_INTERVAL = 50; // กำหนดช่วงเวลาในการส่ง buffer (ในมิลลิวินาที)

// ส่งข้อมูลจาก buffer ไปยัง client ตาม BUFFER_INTERVAL
setInterval(() => {
  if (bufferQueue.length > 0) {
    const data = bufferQueue.shift();
    connectedClients.forEach((ws, i) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else {
        // ถ้าการเชื่อมต่อไม่พร้อมให้เอา client นั้นออกจาก list
        connectedClients.splice(i, 1);
      }
    });
  }
}, BUFFER_INTERVAL);

wsServer.on("connection", (ws, req) => {
  console.log("Connected");

  // เพิ่ม client ที่เชื่อมต่อใหม่ใน array
  connectedClients.push(ws);

  // รับข้อมูลจาก streamer และเพิ่มไปใน bufferQueue
  ws.on("message", (data) => {
    bufferQueue.push(data);
    // จำกัดขนาดของ bufferQueue เพื่อป้องกันการใช้หน่วยความจำมากเกินไป
    if (bufferQueue.length > 100) bufferQueue.shift();
  });

  // เมื่อ client ตัดการเชื่อมต่อให้นำออกจาก list
  ws.on("close", () => {
    connectedClients = connectedClients.filter(client => client !== ws);
  });
});
