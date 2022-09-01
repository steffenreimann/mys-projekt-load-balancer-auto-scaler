const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length; //number of CPUS
var fs = require('fs');
var url = require('url');
const { emit } = require('process');

var { SecondaryServer, SecondaryServerManager, uuidv4, ioc } = require('./secondary-server');
const fm = require('easy-nodejs-app-settings');
var config = null;
var secondaryServerManager = new SecondaryServerManager(cluster.isMaster);
var threads = 24
var test = []
cluster.schedulingPolicy = cluster.SCHED_RR
function startService(params) {
    if (cluster.isMaster) {

        //console.log(setIPV('/hallo', { test: 123 }));
        //console.log(setIPV('/secondaryServerManager', { connections: secondaryServerManager.connections }));
        // HTTP Server for main-server config
        const main_server_express = require('express')
        const main_server_app = main_server_express();
        const main_server_http = require('http')
        const main_server_server = main_server_http.createServer(main_server_app);
        const main_server_io = require('socket.io')(main_server_server);

        main_server_app.use(main_server_express.static('public'))
        main_server_app.get('/', function (req, res) {
            console.log(__dirname + '/public/index.html');
            res.sendFile(__dirname + '/public/index.html');
        });

        secondaryServerManager.secServers

        for (const key in secondaryServerManager.secServers) {
            if (Object.hasOwnProperty.call(secondaryServerManager.secServers, key)) {
                const element = secondaryServerManager.secServers[key];
                element.on('statusChanged', function (data) {
                    //console.log('statusChanged', data.status);
                    main_server_io.emit('statusChanged', key, data.status);
                });
            }
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
            socket.on('getsecondaryServerManager', async (variable, cb) => {
                //var key = `secondaryServer.${data.id}.host`
                // await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
                //removeServerById(data.id)

                cb(index(secondaryServerManager, variable))
            });

            socket.on('getBestServer', async (variable, cb) => {
                //var key = `secondaryServer.${data.id}.host`
                // await config.setKey({ [`secondaryServer.${data.id}.host`]: data.host });
                //removeServerById(data.id)
                var bs = await secondaryServerManager.getBestServer()
                //console.log(bs);
                cb({ host: bs.host, webserver_port: bs.webserver_port })

            });
            socket.on('reqPerSec', async (data) => {
                main_server_io.emit('reqPerSec', data);
            });

            socket.on('getReqPerSec', async (data) => {
                test.push(data)
                if (test.length == threads) {
                    //resolve(test)
                    //console.log('resdata', test);
                    var out = {}

                    for (let index = 0; index < test.length; index++) {
                        const element = test[index];
                        for (const key in element) {
                            if (Object.hasOwnProperty.call(element, key)) {
                                const element1 = element[key];
                                if (out[key] == undefined) {
                                    out[key] = 0;
                                }
                                //console.log('element1 : ', element1);
                                //console.log('out[key] : ', out[key]);
                                out[key] += element1;
                            }
                        }
                    }

                    //console.log('resdata', out);
                    main_server_io.emit('reqPerSec', out);
                    test = []
                }
                //main_server_io.emit('reqPerSec', data);
            });
            socket.on('handshake', async (data) => {
                console.log('Handshake with :', data);
                socket.join('workers')

                //main_server_io.to("workers").emit("handshake");
            });
            socket.on('disconnect', () => {
                /* … */
            });
        });

        secondaryServerManager.on('reqPerSec', async function (data) {
            //console.log(sek, 'reqPerSec', data);
            //main_server_io.to("workers").emit("handshake");
            await emitToWorkers('getReqPerSec')

            /*       Promise.all([]).then((values) => {
                      console.log(values);
                  });
       */
        });

        // Fork workers.
        for (var i = 0; i < threads; i++) {
            cluster.fork();    //creating child process
        }

        //on exit of cluster
        cluster.on('exit', (worker, code, signal) => {
            if (signal) {
                console.log(`worker was killed by signal: ${signal}`);
            } else if (code !== 0) {
                console.log(`worker exited with error code: ${code}`);
            } else {
                console.log('worker success!');
            }
        });
        cluster.on('fork', (worker) => {
            worker.on('message', (msg, cb) => {
                console.log(msg);

                cb(0)
            })
        })


        main_server_server.listen(config.data.port, function () {
            console.log(`Config Server Listening on port ${config.data.port}`);
        });

        function emitToWorkers(event, data) {
            return new Promise((resolve, reject) => {
                var test = []
                data = data || {}
                main_server_io.to("workers").emit(event)
            })
        }


    } else {


        const iowc = require("socket.io-client");
        //console.log('SIOC Try Connect to: ', "http://" + that.host + ":" + that.exec_port);
        var socket = iowc("http://localhost:8080");
        socket.on("connect", async () => {
            console.log('worker thread ', cluster.worker.id, ' Connected to Mainthread');
            console.log(await emit('handshake', { workerid: cluster.worker.id }))
        });

        socket.on("statusChanged", (status) => {

        });

        socket.on("handshake", (status) => {
            console.log("handshake: ", status);
        });
        socket.on("getReqPerSec", () => {
            secondaryServerManager.getReqPerSek((data) => {
                //console.log("getReqPerSec: ", data)
                //cb(data)
                socket.emit("getReqPerSec", data)
            })
        });



        // HTTP Server for forwarding
        const exec_server_app = require('express')();
        const exec_server_http = require('http')
        const exec_server_server = exec_server_http.createServer(exec_server_app);
        const exec_server_io = require('socket.io')(exec_server_server);

        exec_server_http.timeout = 0;

        secondaryServerManager.on('reqPerSec', function (data) {
            //console.log('reqPerSec', data);
            socket.emit('reqPerSec', data);
        });

        exec_server_app.get('*', async function (req, res) {

            //console.log('App get *');
            //console.log('App get *', cluster.worker.id);
            //res.redirect(302, "https://google.com");

            //forwardRequest(req, res)

            var isErfolgreich = false
            var tryCount = 0
            //&& tryCount < 10
            while (!isErfolgreich) {

                isErfolgreich = await forwardRequest(req, res)

                if (tryCount > 0) {
                    //wait(1000)
                    console.log('Start Try  :');
                    isErfolgreich = await forwardRequest(req, res)
                }
                tryCount++;
                //console.log('Try Count : ', tryCount, ' war erfolgreich? ', isErfolgreich);
                //wait(1000)
            }
            res.end()
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

        function forwardRequest(req, res) {
            return new Promise(async function (resolve, reject) {
                //console.log('forward request', cluster.worker.id);


                //secondaryServerManager.connections++;
                //var currentSecServer = await emit('getBestServer')

                //var currentSecServer = await emit('getBestServer')
                //console.log(currentSecServer.webserver_port);


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

                //currentSecServer.connections++;
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
                            console.log('writeHeader : ', serverResponse.statusCode);
                            //return
                        }

                        serverResponse.on('data', (chunk) => {
                            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
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
                    console.error('connector error : ', e);

                    serverRequest.set("Connection", "close");
                    serverRequest.connection.destroy();
                    removeEventListeners()

                    //secondaryServerManager.connections--;
                    resolve(false)
                    return

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

        exec_server_server.listen(80, function () {
            //console.log(`Forwarding Server ${cluster.worker.id} Listening on port 80`);
        });
        // Workers can share any TCP connection
        // In this case it is an HTTP server

        function emit(event, data) {
            return new Promise((resolve, reject) => {
                data = data || {}
                socket.emit(event, data, (resdata) => {
                    resolve(resdata)
                })
            })
        }

    }

}

function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

function index(obj, is, value) {
    if (typeof is == 'string') return index(obj, is.split('.'), value);
    else if (is.length == 1 && value !== undefined) return (obj[is[0]] = value);
    else if (is.length == 0) return obj;
    else return index(obj[is[0]], is.slice(1), value);
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


        //console.log("connected = ", connected);
        //secs.start()
    }
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
    initServers();
    startService();
}
init()



