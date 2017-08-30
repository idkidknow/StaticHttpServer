"use strict";
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

function staticHttpServer(root, port, hostname) {
    const defaultRoot = process.cwd();
    const defaultPort = 23333;
    const defaultHost = "0.0.0.0";

    root = root || defaultRoot;
    port = port || defaultPort;
    hostname = hostname || defaultHost;

    var server = http.createServer(onRequest);

    server.listen(port, hostname, function () {
        console.log("The static http server is running at http://" + hostname + ":" + port + "/");
    });

    function onRequest(req, res) {
        var name = url.parse(req.url).pathname;
        var pathname = path.join(root, name);
        fs.stat(pathname, function (err, stats) {
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
            res.writeHead(404, {"Content-Type": "text/html;charset=utf-8"});
            res.end("404 Not Found: " + name + "\n");
        }

        function error403() {
            res.writeHead(404, {"Content-Type": "text/html;charset=utf-8"});
            res.end("403: " + name + "\n");
        }

        function directoryList() {
            var files = fs.readdirSync(pathname);
            var str = "";
            files.unshift("..");
            files.forEach(function (file) {
                var filePath = path.join(name, file);
                var slash = fs.statSync(path.join(root, filePath)).isDirectory() ? "/" : "";
                str += "<a href='" + filePath + "'>" + file + slash + "</a><br />\n";
            });
            res.writeHead(200, {"Content-Type": "text/html;charset=utf-8"});
            res.end(str);
        }

        function fileOpen() {
            fs.readFile(pathname, function (err, data) {
                if (err) {
                    error403();
                } else {
                    res.writeHead(200, {"Content-Type": mime.lookup(name) + ";charset=utf-8"});
                    res.write(data);
                    res.end();
                }
            });
        }

    }
}
module.exports = staticHttpServer;
