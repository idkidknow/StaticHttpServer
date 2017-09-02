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
        const name = decodeURI(url.parse(req.url).pathname);//The path that the client visits
        let pathname = path.join(root, name);//The true path on server
        fs.stat(pathname, (err, stats) => {
            if (err) {
                solveException('404');
            } else {
                if (stats.isDirectory()) {
                    visitDirectory((err, data, mimeType) => {
                        if (err) {
                            solveException(err);
                        }else {
                            writeAll(200, data, mimeType);
                        }
                    });
                } else {
                    fileOpen(pathname, (err, data) => {
                        if (err) {
                            solveException(err);
                        } else {
                            writeAll(200, data, mime.lookup(name));
                        }
                    });
                }
            }
        });

        function solveException(err) {
            switch (err) {
                case '404':
                    writeAll(404, `404 Not Found: ${name}\n`, 'text/html');
                    break;
                default:
                    writeAll(500, '500 Error\n', 'text/html');
            }
        }

        function directoryIndex(callback) {
            //callback(err, path)
            //The path is the index file name
            const indexFileNames = ['index.html', 'index.htm', 'default.html', 'default.htm'];
            const hasIndex = indexFileNames.some((indexFileName) => {
                fs.access(path.join(pathname, indexFileName), (err) => {
                    if (err) {
                        return false;
                    } else {
                        callback(undefined, path.join(pathname, indexFileName));
                        return true;
                    }
                });
            });
            if (!hasIndex) {
                callback('Index File Not Found');
            }
        }

        function visitDirectory(callback) {
            //callback(err, data, mimeType)
            directoryIndex((err, path) => {
                if (err) {
                    directoryList((err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(undefined, data, 'text/html');
                        }
                    });
                } else {
                    fileOpen(path, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(undefined, data, mime.lookup(path));
                        }
                    });
                }
            });
        }

        function directoryList(callback) {
            //callback(err, data)
            //List the files in the directory
            fs.readdir(pathname, (err, files) => {
                if (err) {
                    callback('500');
                } else {
                    files.unshift('..');
                    let str = '';
                    files.forEach((file) => {
                        const filePath = path.join(name, file);
                        const slash = fs.statSync(path.join(root, filePath)).isDirectory() ? '/' : '';
                        str += `<p><a href="${encodeURI(filePath)}">${file}${slash}</a></p>\n`;
                    });
                    callback(undefined, str);
                }
            });
        }

        function fileOpen(file, callback) {
            //callback(err, data)
            fs.readFile(file, (err, data) => {
                if (err) {
                    callback('500');
                } else {
                    callback(undefined, data);
                }
            });
        }

        function writeAll(statusCode, data, mimeType) {
            res.writeHead(statusCode, {'Content-Type': `${mimeType};charset=utf-8`});
            res.write(data);
            res.end();
        }
    }
}
module.exports = staticHttpServer;
