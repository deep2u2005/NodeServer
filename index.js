/*
primary file for the api
By - Deep 
Date - '11/11/2018'
*/

// Dependency 
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instantiate the http server
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

// Instantiate the https server
var httpsServerOptions = {
    'key': fs.readFileSync('./key.pem'),
    'cert': fs.readFileSync('./cert.pe')
};

var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

console.log('-------------------------------------------------');

// Start the http server
httpServer.listen(config.httpPort, function () {
    console.log('\nHttp Server is listening on port: ', config.httpPort);
    console.log('\nEnvironment: ', config.envName);
});

// Start the https server
httpsServer.listen(config.httpsPort, function () {
    console.log('\nHttps Server is listening on port: ', config.httpsPort);
    console.log('\nEnvironment: ', config.envName);
});

// All the server logic for th both http and https
var unifiedServer = function (req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the http method 
    var method = req.method.toUpperCase();

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the headers as an object 
    var headers = req.headers;

    // Get the payload as an object 
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should go to, if not found use Not Found Handler
        var chosenhandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        //Route the request to the handler specified in the router
        chosenhandler(data, function (statusCode, payload) {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to empty data
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert the payload to a string 
            var payloadString = JSON.stringify(payload);

            // Return the Response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('\nReturning the response : ', statusCode, payloadString);

        });


        // Log the request path 
        console.log('\nRequest is received on path: ' + trimmedPath);
        console.log('\nMethod: ' + method);
        console.log('\nQuery String: ', queryStringObject);
        console.log('\nHeaders: ', headers);
        console.log('\nPayLoad: ', buffer);
        console.log('\nprocess.env.NODE_ENV', process.env.NODE_ENV);
        console.log('-------------------------------------------------');
    });
};

// Define a handlers
var handlers = {};

// Ping handler
handlers.ping = function (data, callBack) {
    // Callback http status code and a payload object
    callBack(200, {
        'notification': 'Server is up and running'
    });

};

// Hello World handler
handlers.helloworld = function (data, callBack) {
    // Callback http status code and a payload object
    callBack(200, {
        'desc': 'Hello World!!'
    });
};


// Not Found handler
handlers.notFound = function (data, callBack) {
    callBack(404);
};

// Define a request router 
var router = {
    'ping':handlers.ping,
    'helloworld':handlers.helloworld
};