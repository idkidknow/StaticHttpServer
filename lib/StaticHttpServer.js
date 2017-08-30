'use strict';
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime');

function staticHttpServer(root = process.cwd(), port = 23333, hostname = '0.0.0.0') {

    const server = http.createServer(onRequest);

    server.listen(port, hostname, () => {
        console.log(`The static http server is running at http://${hostname}:${port}/`);
    });

    function onRequest(req, res) {
        const name = url.parse(req.url).pathname;
        const pathname = path.join(root, name);
        fs.stat(pathname, (err, stats) => {
            if (err) {
                error404();
            } else {
                if (stats.isDirectory()) {
                    directoryList();
                } else {
                    fileOpen();
                }
            }
        });

        function error404() {
            res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
            res.end('404 Not Found: ' + name + '\n');
        }

        function error403() {
            res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
            res.end('403: ' + name + '\n');
        }

        function directoryList() {
            const files = fs.readdirSync(pathname);
            let str = '';
            files.unshift('..');
            files.forEach((file) => {
                const filePath = path.join(name, file);
                const slash = fs.statSync(path.join(root, filePath)).isDirectory() ? '/' : '';
                str += `<a href='${filePath}'>${file}${slash}</a><br />\n`;
            });
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.end(str);
        }

        function fileOpen() {
            fs.readFile(pathname, (err, data) => {
                if (err) {
                    error403();
                } else {
                    res.writeHead(200, {'Content-Type': `${mime.lookup(name)};charset=utf-8`});
                    res.write(data);
                    res.end();
                }
            });
        }

    }
}
module.exports = staticHttpServer;
