module.exports = function() {

    return function(req, res, next) {
        var url = require('url');

        console.log(url.parse(req.url, true).path);

        var urlParts = url.parse(req.url, true),
            options = {
                host: 'simple-note.appspot.com',
                port: 443,
                path: urlParts.path,
                method: req.method
            },
            data = new Buffer('email=ab@adam-butler.com&password=VertR0cks').toString('base64');

        console.log(options.path);

        var request = https.request(options, function(response) {
            res.writeHead(response.statusCode, response.headers);
            response.setEncoding('utf8');
            response.pipe(res);
        });

        request.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            next(e);
        });

        req.on('data', function(chunk){ request.write(chunk); });
        req.on('end', function() { request.end(); });
    };

};