// Steffen Reimann 26.08.2022 
// https://github.com/steffenreimann/
var fs = require('fs');
var url = require('url');

// HTTP Server for main-server config
const main_server_express = require('express')
const main_server_app = main_server_express();
const main_server_http = require('http')
const main_server_server = main_server_http.createServer(main_server_app);
const main_server_io = require('socket.io')(main_server_server);

// HTTP Server for forwarding
const exec_server_app = require('express')();
const exec_server_http = require('http')
const exec_server_server = exec_server_http.createServer(exec_server_app);
const exec_server_io = require('socket.io')(exec_server_server);

var { SecondaryServer, SecondaryServerManager, uuidv4, ioc } = require('./secondary-server');
const fm = require('easy-nodejs-app-settings');
var config = null;
var secondaryServerManager = new SecondaryServerManager();
main_server_app.use(main_server_express.static('public'))
main_server_app.get('/', function (req, res) {
    console.log(__dirname + '/public/index.html');
    res.sendFile(__dirname + '/public/index.html');
});


secondaryServerManager.on('reqPerSec', function (data) {
    //console.log(data);
    main_server_io.emit('reqPerSec', data);
});

//https://gist.github.com/cmawhorter/a527a2350d5982559bb6
//https://stackoverflow.com/questions/13472024/simple-node-js-proxy-by-piping-http-server-to-http-request/13472952#13472952
exec_server_app.get('*', async function (req, res) {

    //console.log('App get *');
    //res.redirect(302, "https://google.com");

    //forwardRequest(req, res)

    var isErfolgreich = false
    var tryCount = 0
    while (!isErfolgreich && tryCount < 10) {

        isErfolgreich = await forwardRequest(req, res)

        if (tryCount > 0) {
            wait(1000)
            console.log('Start Try  :');
            isErfolgreich = await forwardRequest(req, res)
        }
        tryCount++;
        //console.log('Try Count : ', tryCount, ' war erfolgreich? ', isErfolgreich);
        //wait(1000)
    }
    //res.end()
    return
});

exec_server_app.use(function (req, res, next) {
    req.setTimeout(1000, function () {
        // call back function is called when request timed out.
        console.log('req Timeout!');
    });
    next();
});

exec_server_app.use(function (req, res, next) {
    res.setTimeout(1000, function () {
        // call back function is called when request timed out.
        console.log('res Timeout!');
    });
    next();
});

function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

/* 
(node:22688) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 end listeners added to [IncomingMessage]. Use emitter.setMaxListeners() to increase limit  */
//exec_server_http.ClientRequest.setTimeout(100)
function forwardRequest(req, res) {
    return new Promise(async function (resolve, reject) {
        //console.log('forward request');
        secondaryServerManager.connections++;
        var currentSecServer = await secondaryServerManager.getBestServer();
        //console.log('forwardRequest currentSecServer : ', currentSecServer);
        if (currentSecServer == undefined) {
            console.log('currentSecServer == undefined');
            resolve(false)
            return
        }
        if (currentSecServer.host == undefined || currentSecServer.webserver_port == undefined) {
            console.log('currentSecServer.host == undefined');
            resolve(false)
            return;
        }

        currentSecServer.connections++;
        var listener = { serverResponseError: null, reqError: null, reqData: null, reqEnd: null }
        req.pause();
        var options = url.parse(req.url);
        //console.log(req.headers.connection);//close
        options.headers = req.headers;
        //options.headers.connection = 'close';
        options.method = req.method;
        options.host = currentSecServer.host;
        options.port = currentSecServer.webserver_port;
        //options.agent = false;
        options.agent = new exec_server_http.Agent({
            keepAlive: true,
            maxSockets: Infinity
        });

        //console.log('forward request', options);
        var serverRequest = exec_server_http.request(options, function (serverResponse) {
            serverResponse.pause();
            try {
                //console.log('writeHeader : ', serverResponse.statusCode);
                if (serverResponse.statusCode == 408) {
                    //console.log('writeHeader : ', serverResponse.statusCode);
                    //return
                }
                res.writeHeader(serverResponse.statusCode, serverResponse.headers);
                serverResponse.on('data', (chunk) => {
                    //console.log(`res data length: ${chunk.length}`);
                    const isReady = res.write(chunk);
                    //console.log('isReady : ', isReady);
                    //const isReady = fstream.write(data);
                    //Wenn Result nicht Bereit ist 
                    if (!isReady) {
                        //wird der Inputstream gestoppt
                        serverResponse.pause();
                        //ist der resultstream wieder aufnahmefähig 
                        res.once('drain', function () {
                            //wird der inputstream gestartet
                            serverResponse.resume();
                        });
                    }
                });
                serverResponse.on('end', () => {
                    res.end();
                    serverRequest.end();
                    //res.connection.destroy();
                    //serverRequest.connection.destroy();  
                    removeEventListeners()
                    //secondaryServerManager.connections--;
                    resolve(true)
                });
                serverResponse.resume();
            } catch (error) {
                console.log(error);
            }
        });
        listener.serverResponseError = serverRequest.on('error', function (e) {
            //console.error('connector error : ', e);
            removeEventListeners()
            secondaryServerManager.connections--;
            resolve(false)

        });
        req.on('error', listener.reqError = function (e) {
            console.error('req error : ', e);
            removeEventListeners()
            secondaryServerManager.connections--;
            resolve(false)
        });
        req.on('data', listener.reqData = (chunk) => {
            console.log(`req data 0: ${chunk[0]}`);
            console.log(`req data length: ${chunk.length}`);
            serverRequest.write(chunk);
        });
        req.on('end', listener.reqEnd = () => {
            //console.log('Request from Client ' + req.ip + ' End');
            serverRequest.end();
        });
        req.resume();
        function removeEventListeners() {
            req.removeListener('error', listener.reqError);
            req.removeListener('end', listener.reqEnd);
            req.removeListener('data', listener.reqData);
        }
    })
}

function forwardRequest1(req, res) {
    return new Promise(async function (resolve, reject) {
        var currentSecServer = secondaryServerManager.getBestServer();


        //req.pause();

        var options = url.parse(req.url);
        //console.log(req.headers.connection);//close
        options.headers = req.headers;
        //options.headers.connection = 'close';
        options.method = req.method;
        options.agent = false;
        options.host = currentSecServer.host;
        options.port = currentSecServer.webserver_port;
        var reply = await fetch(`http://${currentSecServer.host}:${currentSecServer.webserver_port}`)
        console.log(await reply.text());

        //res.send(Buffer(await reply.text()))
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Trailer': 'Content-HTML'
        });
        res.write(Buffer(await reply.text()));
        //response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
        res.end();
        //var reply = request(`http://${currentSecServer.host}:${currentSecServer.webserver_port}`)
        //req.pipe(reply)
        //reply.pipe(res)
    })
}

main_server_io.on('connection', socket => {
    //console.log('New Config Client Connected!');

    socket.on('getSecondaryServer', async (data, cb) => {
        cb(await secondaryServerManager.getServerStatus())
    });

    socket.on('addSecServer', async (data, cb) => {
        console.log('addSecServer', data);
        await addSecondaryServerToConfig(data)

        const secs = new SecondaryServer(data)
        console.log('AddSecServer = ', secs);
        var uuid = uuidv4();
        var uuid = uuid.replace(/\-/g, "");
        secondaryServerManager.addServer(uuid, secs);
        var connected = await secs.connect();
        console.log("connected = ", connected);
        secs.start()

        return config.data.secondaryServer
    });
    socket.on('saveSecServer', async (data, cb) => {
        //console.log('data : ', data);
        //console.log('before Save Sec Server Host', config.data.secondaryServer[data.id].host);
        //console.log('before Save Sec Server Host', config.data.secondaryServer[data.id].exec_port);
        //console.log('before Save Sec Server Host', config.data.secondaryServer[data.id].webserver_port);
        //console.log('new host ', data.host);
        //console.log('new host ', data.exec_port);
        //console.log('new host ', data.webserver_port);
        await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
        await config.setKey({ [`secondaryServer.${data.id}.exec_port`]: data.exec_port });
        await config.setKey({ [`secondaryServer.${data.id}.webserver_port`]: data.webserver_port });
        //console.log('after Save Sec Server Host', config.data.secondaryServer[data.id].host);
        //console.log('after Save Sec Server Host', config.data.secondaryServer[data.id].exec_port);
        //console.log('after Save Sec Server Host', config.data.secondaryServer[data.id].webserver_port);
        secondaryServerManager.getServerById(data.id).changehost(data.host, data.exec_port, data.webserver_port)
        cb(config.data.secondaryServer)
    });
    socket.on('removeSecServer', async (data, cb) => {
        var key = `secondaryServer.${data.id}.host`
        await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
        removeServerById(data.id)
        cb(config.data.secondaryServer)
    });

    socket.on('startwebserver', async (data, cb) => {
        //var key = `secondaryServer.${data.id}.host`
        // await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
        //removeServerById(data.id)
        secondaryServerManager.getServerById(data.id).start()
        cb('start web server')
    });

    socket.on('stopwebserver', async (data, cb) => {
        //var key = `secondaryServer.${data.id}.host`
        // await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
        //removeServerById(data.id)
        secondaryServerManager.getServerById(data.id).stop()
        cb(config.data.secondaryServer)
    });
    socket.on('disconnect', () => {
        /* … */
    });
});

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

async function initServers() {
    var keyArray = Object.keys(config.data.secondaryServer);
    for (let index = 0; index < keyArray.length; index++) {
        const key = keyArray[index];
        const element = config.data.secondaryServer[key];
        const secs = new SecondaryServer(element)
        //console.log(secs);
        //console.log('init secs', index);
        secondaryServerManager.addServer(key, secs);
        secs.connect();

        secs.on('statusChanged', function (data) {
            //console.log('statusChanged', data.status);
            main_server_io.emit('statusChanged', key, data.status);
        });
        //console.log("connected = ", connected);
        //secs.start()
    }
}

async function addSecondaryServerToConfig(data) {
    var uuid = uuidv4();
    var uuid = uuid.replace(/\-/g, "");
    await config.push({
        secondaryServer: {
            [uuid]: data
        }
    });

    return
}

async function init() {
    config = new fm.File({
        appname: 'mys-loadbalancer-main-server',
        file: 'DataStore.json',
        data: {
            port: 8080,
            secondaryServer: {}
        },
        overwriteOnInit: false,
        doLogging: false // Optional
    })

    await config.init()
    //console.log('Config File Init')

    /*     await addSecondaryServerToConfig({
            host: "192.168.178.23",
            exec_port: 8081,
            webserver_port: 3000,
            prio: 0
        }) */

    //console.log(config)

    exec_server_server.listen(80, function () {
        console.log(`Forwarding Server Listening on port 80`);
    });

    main_server_server.listen(config.data.port, function () {
        console.log(`Config Server Listening on port ${config.data.port}`);
    });

    initServers();
}


init()
