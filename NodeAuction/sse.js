const SSE = require('sse');

module.exports = (server) => {
    const sse = new SSE(server);
    // 이벤트 리스너 생성
    sse.on('connection', (client) =>{
        setInterval(()=>{
            client.send(Date.now().toString());
        }, 1000);
    });
};