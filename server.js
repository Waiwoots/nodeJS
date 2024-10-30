/////////////////////////////////////////////////////////////////
// Broadcasting Your Voice with ESP32-S3 & INMP441 (WSS Version)
// For More Information: https://youtu.be/qq2FRv0lCPw
// Created by Eric N. (ThatProject)
/////////////////////////////////////////////////////////////////

const fs = require("fs");
const path = require("path");
const https = require("https");
const express = require("express");
const WebSocket = require("ws");
const app = express();

const WS_PORT = process.env.WS_PORT || 8888;
const HTTP_PORT = process.env.HTTP_PORT || 8000;

// โหลดใบรับรอง SSL/TLS
const server = https.createServer({
  key: fs.readFileSync("/path/to/key.pem"), // ใส่ path ของไฟล์ private key
  cert: fs.readFileSync("/path/to/cert.pem"), // ใส่ path ของไฟล์ certificate
});

// สร้าง WebSocket Server ที่ใช้ WSS (Secure WebSocket)
const wsServer = new WebSocket.Server({ server });

// array of connected websocket clients
let connectedClients = [];

// เมื่อมี client เชื่อมต่อเข้ามา
wsServer.on("connection", (ws, req) => {
  console.log("Connected");
  connectedClients.push(ws);

  ws.on("message", (data) => {
    connectedClients.forEach((client, i) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      } else {
        connectedClients.splice(i, 1);
      }
    });
  });
});

// HTTP and Express configurations
app.use("/image", express.static("image"));
app.use("/js", express.static("js"));
app.get("/audio", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./audio_client.html"))
);

// เริ่มต้น HTTPS และ WSS server
server.listen(WS_PORT, () => {
  console.log(`Secure WS server is listening at wss://localhost:${WS_PORT}`);
});

app.listen(HTTP_PORT, () => {
  console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`);
});
