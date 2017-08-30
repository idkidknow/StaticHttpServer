var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');


var root = process.argv[2] ? process.argv[2] : process.cwd();
var port = process.argv[3] ? process.argv[3] : 23333;

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
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("404 Not Found: " + name + "\n");
    }

    function error403() {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("403: " + name + "\n");
    }

    function directoryList() {
        var files = fs.readdirSync(pathname);
        var str = "";
        files.unshift("..");
        files.forEach(function (file) {
            var filePath = path.join(name, file);
            var slash = fs.statSync(path.join(root, filePath)).isDirectory() ? "/" : "";
            str += "<a href='" + filePath + "'>" + file + slash + "</a><br />";
        });
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(str);
    }

    function fileOpen() {
        fs.readFile(pathname, function (err, data) {
            if (err) {
                error403();
            } else {
                res.writeHead(200, {"Content-Type": mime.lookup(name)});
                res.write(data);
                res.end();
            }
        });
    }

}


var server = http.createServer(onRequest);

server.listen(port, function (){
    console.log("The static http server is running at http://127.0.0.1:" + port + "/");
});
