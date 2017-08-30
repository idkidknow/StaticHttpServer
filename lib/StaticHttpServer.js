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
        const name = decodeURI(url.parse(req.url).pathname);
        let pathname = path.join(root, name);
        let mimetype = mime.lookup(name);
        fs.stat(pathname, (err, stats) => {
            if (err) {
                error404();
            } else {
                if (stats.isDirectory()) {
                    visitDirectory((data) => {
                        res.writeHead(200, {'Content-Type': `${mimetype};charset=utf-8`});
                        res.write(data);
                        res.end();
                    });
                } else {
                    const data = fileOpen(pathname);
                    res.writeHead(200, {'Content-Type': `${mimetype};charset=utf-8`});
                    res.write(data);
                    res.end();
                }
            }
        });

        function error404() {
            res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
            res.end('404 Not Found: ' + name + '\n');
        }

        function error500() {
            res.writeHead(500, {'Content-Type': 'text/html;charset=utf-8'});
            res.end('500 Error\n');
        }

        function directoryIndex(callback) {
            const indexFileNames = ['index.html', 'index.htm', 'default.html', 'default.htm'];
            for (let index in indexFileNames) {
                if (fs.existsSync(path.join(pathname, indexFileNames[index]))) {
                    callback(0, path.join(pathname, indexFileNames[index]));
                }
            }
            callback(1, '');
        }

        function visitDirectory(callback) {
            directoryIndex((err, path) => {
                if (err) {
                    callback(directoryList());
                } else {
                    callback(fileOpen(path));
                }
            });
        }

        function directoryList() {
            const files = fs.readdirSync(pathname);
            let str = '';
            files.unshift('..');
            for (let file in files) {
                const filePath = path.join(name, files[file]);
                const slash = fs.statSync(path.join(root, filePath)).isDirectory() ? '/' : '';
                str += `<a href="${encodeURI(filePath)}">${files[file]}${slash}</a><br />\n`;
            }
            mimetype = 'text/html';
            return str;
        }

        function fileOpen(file) {
            mimetype = mime.lookup(file);
            return fs.readFileSync(file);
        }

    }
}
module.exports = staticHttpServer;
