import coap from 'coap';

const server = coap.createServer();
const tokenIntervals = new Map();

server.on('request', (req, res) => {
    const token = req._packet.token?.toString('hex'); // แปลง token เป็น string เพื่อใช้เป็น key

    if (!token) {
        return res.end('No token provided\n');
    }

    if (req.headers.Observe !== 0) {
        return res.end(new Date().toISOString() + '\n');
    }

    // ถ้ามี interval เดิมอยู่แล้ว ให้เคลียร์ก่อน
    if (tokenIntervals.has(token)) {
        clearInterval(tokenIntervals.get(token));
 
    }

    const interval = setInterval(() => { 
      res.write(`{ Time :${new Date().toISOString()}, Token : ${token}, KeepAlive : true , Data1 : 1 , Data2 : ${Math.random()} }`
               
        + '\n'        
        )
   
        console.log(`Sent update for token ${token}`);
        
    }, 5000);
    console.log(`Started interval for token ${interval} with token ${token}`);
    tokenIntervals.set(token, interval);

    res.on('finish', () => {
        clearInterval(interval);
        tokenIntervals.delete(token);
    });
});

server.listen(() => {
    console.log('server started');
});
