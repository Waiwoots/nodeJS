// import coap from 'coap';

// const server = coap.createServer();


// server.on('request', (req, res) => {
//     console.log('request received')
//      let token = req._packet.token?.toString('hex'); // แปลง token เป็น string เพื่อใช้เป็น key
//     if (req.headers.Observe !== 0) {
//         return res.end(new Date().toISOString() + '\n')
//     }

//     const interval = setInterval(() => {
//         res.write(new Date().toISOString() + '\n')
//         console.log(`Started interval for token ${interval} with token ${token}`);
//     }, 1000)

//     res.on('finish', () => {
//         clearInterval(interval)
//     })
// })

// server.listen(() => {
//     console.log('server started')
// })
////////////////////////////////////////////// 30 วินาที อายุ Token ////////////////////////////////////
import coap from 'coap';

const server = coap.createServer();
const tokenIntervals = new Map();
let remainingTime = 30; // เริ่มต้นที่ 30 วินาที

server.on('request', (req, res) => {
    console.log('request received')
    let token = req._packet.token?.toString('hex'); // แปลง token เป็น string เพื่อใช้เป็น key
    if (req.headers.Observe !== 0) {
        return res.end(new Date().toISOString() + '\n')
    }

    const interval = setInterval(() => {
        // res.write(`{ "Time" :${new Date().toISOString()}, "Token" : ${token}, "KeepAlive" : 30 ,"Data1" : 1 , "Data2" : ${Math.random()} }`
         remainingTime--; // ลดค่านับถอยหลังลง 1
         res.setHeader('Content-Type', 'application/json');           
         res.write(`{ "Time" :"${new Date().toISOString()}", "Token" : "${token}", "KeepAlive" : ${remainingTime} ,"Data1" : 0 , "Data2" : ${Math.random()} }`
         
    //     const responseData = {
    //     Time: new Date().toISOString(),
    //     Token: token,
    //     KeepAlive: 30,
    //     Data1: 1,
    //     Data2: Math.random()
    // };
    //     res.setHeader('Content-Type', 'application/json');
    //     res.end(JSON.stringify(responseData));
        
        + '\n'        
        )
   
        console.log(`Started interval for token ${interval} with token ${token}`);
    }, 5000)

    tokenIntervals.set(token, interval);

    // เคลียร์ interval หลังจาก 30 วินาที
    setTimeout(() => {
        clearInterval(interval);
        tokenIntervals.delete(token);
        console.log(`Token ${token} หมดอายุ`);
    }, 30000) // 30 วินาที

    res.on('finish', () => {
        clearInterval(interval);
        tokenIntervals.delete(token);
    })
})

server.listen(() => {
    console.log('server started')
})