import express from 'express' 
import path from 'path'
import coap from'coap'

const app = express()
const port = 3001

// เก็บ response objects ของ clients ที่เชื่อมต่ออยู่
let clients = []




// CoAP server setup
const server = coap.createServer()

server.on('request', (req, res) => {
  
       const payload = req.payload.toString()
       console.log('Received CoAP data:', payload)

         // ส่งข้อมูลที่ได้รับจาก CoAP ไปยังทุก client ที่เชื่อมต่อกับ SSE
       clients.forEach(client => {
        // ใช้ SSE format เพื่อส่งข้อมูล: "data: [payload]\n\n"
       client.write(`data: ${payload}\n\n`)
      })

        // ตอบกลับ CoAP client
      let response;
      if (req.payload.toString() === '1') {
        response = '0';
      } else if (req.payload.toString() === '0') {
        response = '1';
      } else {
        response = 'Hello ' + req.url.split('/')[1] + '\nMessage payload:\n' + req.payload + '\n';
      }
      res.end(response);
})

// the default CoAP port is 5683
server.listen(() => {
    const req = coap.request('coap://localhost/light')

    const payload = {
        title: 'this is a test payload',
        body: 'containing nothing useful'
    }

  req.write(JSON.stringify(payload))

  req.on('response', (res) => {
    res.pipe(process.stdout)
    res.on('end', () => {
      // process.exit(0)
    })
  })

  req.end()
})

// SSE endpoint setup
app.get('/events', (req, res) => {
  // ตั้งค่า HTTP headers ให้เป็น SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // ส่งข้อความทดสอบทุกๆ 5 วินาที
  const intervalId = setInterval(() => {
    res.write(`data: ${new Date().toISOString()}\n\n`)
  }, 5000)  
  clients.push(res)

  // จัดการเมื่อ client ยกเลิกการเชื่อมต่อ
  req.on('close', () => {
    clients = clients.filter(client => client !== res)
    console.log('Client disconnected')
  })
})

app.listen(port, () => {
  console.log(`HTTP server with SSE endpoint started on port ${port}`)
})