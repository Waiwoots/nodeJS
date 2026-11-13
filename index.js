import express from 'express'
// import coap from 'coap'
import path from 'path'
import mqtt from 'mqtt'
import { randomUUID } from 'node:crypto'

const __dirname = path.resolve()
const app = express()
const port = 3000

// --- 1. ตัวแปรเก็บข้อมูล (รวมศูนย์ไว้ที่นี่) ---
let Data1 = 0
let Data2 = Math.random() * 100
let Temp = "0"
let Humid = "0"
let mqttLedStatus = "OFF" // สถานะ LED จาก MQTT
let mqttConnected = false
let Token, clients = []
let Message = "Waiting for message..."
const smartMeterTopics = [
    'import_energy_kwh',
    'active_power',
    'voltage_l1',
    'current_l1',
    'frequency',
    'power_factor',
    'export_energy',
    'reactive_power',
    'apparent_power',
    'export_active',
    'import_reactive',
    'export_reactive'
]
const smartMeterData = Object.fromEntries(smartMeterTopics.map(topic => [topic, null]))
let meterTimestamp = null

// --- 2. ตั้งค่า MQTT Client ---
const mqttBroker = "mqtts://d090e9b4.ala.us-east-1.emqxsl.com:8883" // เปลี่ยนเป็น URL ของ MQTT Broker ของคุณ




// สร้าง options สำหรับการ Authentication
const mqttOptions = {
    username: 'admin',    // ใส่ Username ตามที่ตั้งใน EMQX
    password: 'W41w00ts@',    // ใส่ Password ตามที่ตั้งใน EMQX
    keepalive: 1000,        // (แถม) ตั้งค่า Keep Alive ให้สัมพันธ์กับ ESP32
    clientId: `nodejs_backend_${randomUUID()}`
}
// เชื่อมต่อโดยใส่ options เข้าไปด้วย
const mqttClient = mqtt.connect(mqttBroker, mqttOptions)

mqttClient.on('connect', () => {
    mqttConnected = true
    console.log('Connected to MQTT Broker @', mqttBroker)
    // mqttClient.subscribe('Temp')
    // mqttClient.subscribe('Humidity')
    // mqttClient.subscribe('LED') 
    // mqttClient.subscribe('Message') 
    
    // Meter topics are root-level, so one filter avoids the broker's subscription limit.
    mqttClient.subscribe('+', { qos: 0 }, (error, granted = []) => {
        if (error) {
            console.error('Failed to subscribe to smart meter topics:', error.message)
            return
        }

        if (granted.length !== 1 || granted[0].qos === 128) {
            console.error('MQTT broker rejected the smart meter topic subscription')
            return
        }

        console.log('Subscribed to root-level MQTT topics')
    })
})

mqttClient.on('close', () => {
    mqttConnected = false
    console.log('MQTT connection closed')
})

mqttClient.on('error', error => {
    console.error('MQTT client error:', error.message)
})

mqttClient.on('message', (topic, message) => {
    const val = message.toString()
    // if (topic === 'Temp') {
    //     Temp = val
    // } else if (topic === 'Humidity') {
    //     Humid = val
    // } else if (topic === 'LED') {
    //     // รับค่ามาปรับเป็นตัวใหญ่เพื่อให้หน้าบ้านตรวจสอบง่าย
    //     mqttLedStatus = val.toUpperCase() 
    // }else if (topic === 'Message') {
    //     Message = val
    // }
    if (Object.prototype.hasOwnProperty.call(smartMeterData, topic)) {
        smartMeterData[topic] = val
        meterTimestamp = new Date().toISOString()
        console.log(`MQTT Update -> ${topic}: ${val}`)
    }
})


app.get('/events', (req, res) => {
    // 1. ป้องกันการเข้าถึงโดยตรง (Direct Access)
    // ถ้าไม่ใช่การเรียกจาก EventSource ให้ส่ง error 403
    if (req.headers.accept !== 'text/event-stream') {
        return res.status(403).json({ error: "Direct access not allowed" });
    }

    // 2. ตั้งค่า Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform', // เพิ่ม no-transform ป้องกันพวก proxy แก้ไขข้อมูล
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*', // ถ้าไม่ได้รันแยก domain ควรเปลี่ยน '*' เป็นชื่อ domain ของเรา
        'X-Accel-Buffering': 'no' // สำคัญมากสำหรับ Nginx เพื่อให้ข้อมูลไหลแบบ Real-time
    });

    // 3. ฟังก์ชันส่งข้อมูล
    const sendData = () => {
        const data = JSON.stringify({ 
            // Temp: Temp, 
            // Humid: Humid, 
            // MqttLED: mqttLedStatus,
            // Message: Message,
            // Data1: Data1,
            // Data2: Data2,
            MqttConnected: mqttConnected,
            MeterTimestamp: meterTimestamp,
            ...smartMeterData,
            Timestamp: new Date().toISOString() // เพิ่ม Timestamp เพื่อให้หน้าบ้านเช็คความสดของข้อมูลได้
        });
        res.write(`data: ${data}\n\n`);
    };

    // ส่งทันทีหนึ่งครั้งเมื่อเชื่อมต่อสำเร็จ (ไม่ต้องรอครบ 1 วินาทีแรก)
    sendData();

    const interval = setInterval(sendData, 2000);

    // 4. จัดการเมื่อการเชื่อมต่อถูกตัด
    req.on('close', () => {
        console.log('Client closed SSE connection');
        clearInterval(interval);
        res.end(); // ปิดกระบวนการ response ให้สมบูรณ์
    });
});



app.get('/test3.html', (req, res) => res.sendFile('test3.html', { root: __dirname }))
app.get('/dashboard', (req, res) => res.sendFile('dashboard.html', { root: __dirname }))
app.get('/smart-meter', (req, res) => res.sendFile('smart-meter.html', { root: __dirname }))
app.get('/manifest.webmanifest', (req, res) => {
    res.type('application/manifest+json').sendFile('manifest.webmanifest', { root: __dirname })
})
app.get('/service-worker.js', (req, res) => {
    res.set('Cache-Control', 'no-cache').sendFile('service-worker.js', { root: __dirname })
})

app.listen(port, () => console.log(`HTTP/SSE Server started on port ${port}`))
