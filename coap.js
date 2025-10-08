import express from 'express'
import coap from 'coap'
import path from 'path'

const __dirname = path.resolve()


const app = express()
const port = 8080

// สร้างตัวแปรสำหรับเก็บข้อมูล session
const sessions = new Map();






// เก็บ response objects ของ clients ที่เชื่อมต่อกับ SSE
let clients = []

let Data1 , Data2, Temp, Humid,Token,session

Data1 = 0
Data2 = Math.random() * 100
Temp = (Math.random() * 30).toFixed(2)
Humid = (Math.random() * 100).toFixed(2)


// CoAP server setup
const coapServer = coap.createServer()

coapServer.on('request', (req, res) => {




  
      // 1. Check if the request is an Observe request
    if (req.headers.Observe === 0  && req.url === '/sensor/observe') {
      // console.log('Observe request received from client:', req);
        console.log('Observe request received from client:', req); 
        console.log('CoAP Request URL:', req.url);
        console.log('CoAP Request Observe Option:', req.headers.Observe);
        console.log('CoAP Request Options:', req.options);
       
        // นำค่า Token จาก packet มาใช้  เพื่อการจัดการ session
         Token = req._packet.token.toString('hex');
        
          console.log('Current  token:', Token);

   

        let  KeepAliveCounter =30 ; // seconds
            
      // res.write("Start:"+new Date().toISOString() + '\n');

        const interval = setInterval(() => {
            // Send a new update every 5 seconds
                 KeepAliveCounter--; 

            res.write(JSON.stringify({ "KeepAlive": KeepAliveCounter,
                        "Data1" : Data1,
                        "Data2" : Data2,
                        "Temp"  : Temp,
                        "Humid" : Humid,
                         "Token": Token
                         
          }) + '\n');
          //  res.write(new Date().toISOString() + '\n');
         
            console.log('Sent an Observe update.');
           
            if (KeepAliveCounter <=0) {
              res.end("End:"+new Date().toISOString() + '\n');
              clearInterval(interval);
              console.log('Observe session ended due to KeepAlive timeout.');
            }
        }, 5000);

        // Clean up when the client disconnects
        res.on('finish', () => {
            clearInterval(interval);
            console.log('CoAP Observe session ended.');
        });
        
        return; // Exit the function to prevent further processing
    }

    //////////////////////////////////////////////////////////////////////

    // 2. Handle a regular CoAP request (if it's not an Observe request)
    // รับข้อมูลจาก CoAP client
  const payload = req.payload.toString()
  console.log('Received CoAP data:', payload)


    /////////////////////////////////////////////////

  //    let Token  = ['123456789','234568'] // กำหนด Token คงที่สำหรับการทดสอบ



  //  let token = req._packet.token.toString('hex');
  //  let KeepAlive_Payload = req.payload.toString();

  //   console.log('Token:', token);  
  //   console.log('KeepAlive_Payload:', token);  
   
  //    if(payload.includes(token)){
  //    // สร้าง session ใหม่ถ้ายังไม่มี
  //   session = { token, created: Date.now() };
  //   sessions.set(token, session);
  //   console.log('New session created:', session);
  // }


  ////////////////////////////////////////////////

  // ส่งข้อมูลที่ได้รับจาก CoAP ไปยังทุก client ที่เชื่อมต่อกับ SSE
  clients.forEach(client => {
    // ใช้ SSE format เพื่อส่งข้อมูล: "data: [payload]\n\n"
    client.write(`data: ${payload}\n\n`)
  })

  // ตอบกลับ CoAP client
  let response
  if (payload === '1') {
    response = '0'
  } else if (payload === '0') {
    response = '1'
  } else {
    response = 'Hello ' + req.url.split('/')[1] + '\nMessage payload:\n' + payload + '\n'
  }
  res.end(response)
})

// Start the CoAP server on its default port
coapServer.listen(() => {

  console.log('CoAP server is listening on port 5683')
})

// SSE endpoint setup
app.get('/events', (req, res) => {
  // ตั้งค่า HTTP headers ให้เป็น SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*') // ป้องกัน CORS

  // เพิ่ม response object ของ client เข้าไปใน clients array
  clients.push(res)
  console.log('New client connected to SSE')

  // จัดการเมื่อ client ยกเลิกการเชื่อมต่อ
  req.on('close', () => {
    clients = clients.filter(client => client !== res)
    console.log('A client disconnected from SSE')
  })
})
app.get('/events/led', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // ส่งสถานะ Data1 ในรูปแบบ led : <value>
  res.write(`data: led : ${Data1}\n\n`)
   console.log('New client connected to SSE (LED)')

  // เพิ่ม response object ของ client เข้าไปใน clients array
  // ส่งค่า Data1 ไปยัง client ทุกๆ 2 วินาที
  const interval = setInterval(() => {
    res.write(`data: led : ${Data1}\n\n`)
  }, 2000)

  // เมื่อ client ยกเลิกการเชื่อมต่อ ให้หยุดส่งข้อมูล
  req.on('close', () => {
    clearInterval(interval)
    console.log('A client disconnected from SSE (LED)')
  })

 

 
})
app.post('/events/control/led', express.json(), (req, res) => {

  const { led } = req.body;
  console.log('req.body', req.body);
  if (led === 1 || led === 0) {
    Data1 = led;
    res.json({ status: 'success', 'led': Data1 });
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid value. Use 0 or 1.' });
    console.log('error  Invalid value. Use 0 or 1.',e.req.body)
  }
});

app.get('/Waiwoot', (req, res) => {
  res.send('Hello Waiwoot...!')
})
app.get('/dashboard', (req, res) => {
     res.sendFile('test3.html', { root: __dirname })
    
})


// Start the Express server
app.listen(port, () => {
  console.log(`HTTP server with SSE endpoint started on port ${port}`)

})
