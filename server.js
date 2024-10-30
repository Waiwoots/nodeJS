/////////////////////////////////////////////////////////////////
/*
  Broadcasting Your Voice with ESP32-S3 & INMP441
  For More Information: https://youtu.be/qq2FRv0lCPw
  Created by Eric N. (ThatProject)
*/
/////////////////////////////////////////////////////////////////

const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const app = express();

const WS_PORT = process.env.WS_PORT || 8080 ;
const HTTP_PORT = process.env.HTTP_PORT || 8000;

const wss = new WebSocket.Server({ port: WS_PORT }, () =>
  console.log(`WS server is listening at ws://localhost:${WS_PORT}`)
);

// array of connected websocket clients
let connectedClients = [];

wss.on("connection", (wss, req) => {
  console.log("Connected");
  // add new connected client
  connectedClients.push(ws);
  // listen for messages from the streamer, the clients will not send anything so we don't need to filter
  wss.on("message", (data) => {
    connectedClients.forEach((ws, i) => {
      if (wss.readyState === wss.OPEN) {
        wss.send(data);
      } else {
        connectedClients.splice(i, 1);
      }
    });
  });
});

// HTTP stuff
app.use("/image", express.static("image"));
app.use("/js", express.static("js"));
app.get("/audio", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./audio_client.html"))
);
app.listen(HTTP_PORT, () =>
  console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`)
);

