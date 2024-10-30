
// นำเข้าไลบรารีที่จำเป็น
const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

// กำหนดเส้นทางไปยังไฟล์ใบรับรอง SSL/TLS
const server = https.createServer({
  cert: fs.readFileSync('/path/to/cert.pem'), // เส้นทางไฟล์ใบรับรอง SSL
  key: fs.readFileSync('/path/to/key.pem')    // เส้นทางไฟล์กุญแจ SSL
});

// สร้าง WebSocket Server ที่ใช้ HTTPS
const wss = new WebSocket.Server({ server });

// เมื่อมี client เข้ามาเชื่อมต่อ
wss.on('connection', (ws) => {
  console.log('Client connected');

  // เมื่อได้รับข้อความจาก client
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send('Message received: ' + message);
  });

  // ส่งข้อความให้ client หลังจากเชื่อมต่อสำเร็จ
  ws.send('Welcome to the secure WebSocket server!');
});

// เริ่มต้นเซิร์ฟเวอร์ที่พอร์ต 443
server.listen(443, () => {
  console.log('Secure WebSocket server is running on wss://localhost:443');
});
