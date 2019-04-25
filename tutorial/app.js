const http = require('http');

const server = http.createServer(function rqListener(req, res) {
    const url = req.url;
    if (url === '/') {
        
    }
    console.log(req.url, req.method, req.headers);
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res
    res.write('<html>');
});

server.listen(3000);