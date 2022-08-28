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

var privateKey = fs.readFileSync(getUserHome() + '/.ssh/id_rsa', 'utf8');


main_server_app.use(main_server_express.static('public'))
main_server_app.get('/', function (req, res) {
    console.log(__dirname + '/public/index.html');
    res.sendFile(__dirname + '/public/index.html');
});

//https://gist.github.com/cmawhorter/a527a2350d5982559bb6
//https://stackoverflow.com/questions/13472024/simple-node-js-proxy-by-piping-http-server-to-http-request/13472952#13472952
exec_server_app.get('*', async function (req, res) {
    var isErfolgreich = false
    var tryCount = 0
    while (!isErfolgreich || tryCount < 10) {
        isErfolgreich = await forwardRequest(req, res)
        tryCount++;
        console.log('Try Count : ', tryCount);
    }
});



/* 

(node:22688) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 end listeners added to [IncomingMessage]. Use emitter.setMaxListeners() to increase limit  */

function forwardRequest(req, res) {
    return new Promise(function (resolve, reject) {
        var currentSecServer = secondaryServerManager.getBestServer();
        var id = uuidv4();
        var listener = { serverResponseError: null, reqError: null, reqData: null, reqEnd: null }
        currentSecServer.addConnection({ id: id, headers: req.headers, method: req.method, startDate: new Date(), endDate: null })

        req.pause();

        var options = url.parse(req.url);
        //console.log(req.headers.connection);//close
        options.headers = req.headers;
        //options.headers.connection = 'close';
        options.method = req.method;
        options.agent = false;
        options.host = currentSecServer.host;
        options.port = currentSecServer.webserver_port;

        var serverRequest = exec_server_http.request(options, function (serverResponse) {
            serverResponse.pause();
            try {

                console.log('writeHeader : ', serverResponse.statusCode, ' // ', serverResponse.headers);

                if (serverResponse.statusCode == 408) {
                    return
                }

                res.writeHeader(serverResponse.statusCode, serverResponse.headers);

                serverResponse.on('data', (chunk) => {
                    //console.log(`res data length: ${chunk.length}`);
                    res.write(chunk);
                });
                serverResponse.resume();
                serverResponse.on('end', () => {
                    console.log('Response from Server ' + currentSecServer.host + ' End');

                    res.end();
                    serverRequest.end();
                    serverRequest.destroy();
                    serverRequest.abort();
                    //serverRequest.close()

                    //serverResponse.end()
                    //serverResponse.abort();
                    //serverResponse.close()
                    serverResponse.destroy();


                    currentSecServer.connections[id].endDate = new Date();
                    currentSecServer.removeConnection(id)
                    console.log('request *' + req.url + " Fertig nach: " + ((currentSecServer.connectionHistory[id].endDate - currentSecServer.connectionHistory[id].startDate) / 1000) + " ms");
                    removeEventListeners()
                    resolve(true)
                });

            } catch (error) {
                console.log(error);
            }

        });


        listener.serverResponseError = serverRequest.on('error', function (e) {
            //console.error('connector error : ', e);
            removeEventListeners()
            resolve(false)

        });

        req.on('error', listener.reqError = function (e) {
            console.error('req error : ', e);
            removeEventListeners()
            resolve(false)
        });

        req.on('data', listener.reqData = (chunk) => {
            console.log(`req data 0: ${chunk[0]}`);
            console.log(`req data length: ${chunk.length}`);
            serverRequest.write(chunk);
        });

        req.on('end', listener.reqEnd = () => {
            console.log('Request from Client ' + req.ip + ' End');
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



main_server_io.on('connection', socket => {
    console.log('New Config Client Connected!');
    socket.on('getSecondaryServer', (data, cb) => {
        console.log('getSecondaryServer');
        cb(config.data.secondaryServer)
        return config.data.secondaryServer
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
        secondaryServerManager.addServer(secs);
        var connected = await secs.connect();
        console.log("connected = ", connected);
        secs.start()
    }
}

async function addSecondaryServerToConfig(data) {
    var uuid = uuidv4();
    await config.setKey({
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
        overwriteOnInit: true,
        doLogging: true // Optional
    })

    await config.init()
    console.log('Config File Init')

    await addSecondaryServerToConfig({
        host: "192.168.178.23",
        exec_port: 8081,
        webserver_port: 3000,
        prio: 0
    })

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
