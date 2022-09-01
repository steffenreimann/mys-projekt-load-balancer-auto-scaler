
const { v4: uuidv4 } = require('uuid');
const ioc = require("socket.io-client");
var EventEmitter = require('events').EventEmitter;
util = require('util');

class SecondaryServerManager {
    constructor() {
        this.secServers = {}
        this.connections = 0;
        this.runningServers = null;
        this.notRunningServers = null;
        this.bestServer = null;
        this.timer = setInterval(() => {
            var reqPerSec = this.calcAllReqPerSec();
            reqPerSec['main'] = this.connections
            this.connections = 0;

            this.runningServers = this.getRunningServers()
            this.notRunningServers = this.getNotRunningServer()
            //console.log(reqPerSec);
            //this.#event = new EventEmitter("reqPerSec", { detail: reqPerSec });
            //this.dispatchEvent(this.#event);

            /* if (this.runningServers < 2 && this.notRunningServers > 0) {
                await this.startNextServer()
            } */

            if (reqPerSec['main'] / this.runningServers.length > 5 && this.notRunningServers.length > 0 || this.runningServers.length < 2 && this.notRunningServers.length > 0) {
                console.log('Start next Server');
                this.startNextServer()
            } else {
                //console.log('overall nicht über 50');
            }

            //this.bestServer = this.getServerWithLowestReqPerSec()
            //console.log('best server : ', this.bestServer.exec_port);
            this.emit('reqPerSec', reqPerSec);
        }, 1000)
    }
    addServer(id, secServer) {
        //var id = uuidv4();
        this.secServers[id] = secServer
    }
    removeServerById(id) {
        this.secServer[id].dispose();
        delete this.secServers[id];
    }
    getServerById(id) {
        return this.secServers[id];
    }
    async getBestServer() {

        //console.log(Object.values(Object.values(this.secServers)[0].connections).length);
        /*         if (Object.values(Object.values(this.secServers)[0].connections).length > 10) {
                    // console.log(Object.values(this.secServers)[0].connections);
                    // console.log(Object.values(this.secServers)[0].connectionHistory);
                    console.log('Over 10');
                } */
        //var runningServers = this.getRunningServers()
        //console.log('Get best server running servers = ', runningServers.length);
        // console.log('Get best server running servers = ', this.getNotRunningServer().length);

        //return this.bestServer
        return this.getServerWithLowestReqPerSec()
        // return Object.values(this.secServers)[0]
    }
    async getServerStatus() {

        var arr = Object.keys(this.secServers)
        var ret = {}
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            //console.log('getServerStatus element = ', element);
            //console.log('getServerStatus this.secServers[element] = ', this.secServers[element]);
            ret[element] = {}
            ret[element].status = await this.secServers[element].getStatus()
            ret[element].connections = this.secServers[element].connections
            ret[element].connectionHistory = this.secServers[element].connectionHistory
            ret[element].host = this.secServers[element].host
            ret[element].exec_port = this.secServers[element].exec_port
            ret[element].webserver_port = this.secServers[element].webserver_port
            //console.log('getServerStatus : ', this.secServers[element]);
        }

        //console.log('getServerStatus : ', ret);
        return ret;
    }

    getRunningServers() {
        var retArr = []
        for (const key in this.secServers) {
            if (Object.hasOwnProperty.call(this.secServers, key)) {
                const element = this.secServers[key];
                //console.log('getRunningServers element.status.execServer.connected: ', element.status.execServer.connected);
                //console.log('getRunningServers element.status.webServer.running: ', element.status.webServer.running);
                if (element.status.webServer.running && element.status.execServer.connected) {
                    retArr.push(element)
                }
            }
        }
        return retArr
    }
    getNotRunningServer() {
        var retArr = []
        for (const key in this.secServers) {
            if (Object.hasOwnProperty.call(this.secServers, key)) {
                const element = this.secServers[key];
                if (!element.status.webServer.running && element.status.execServer.connected) {
                    retArr.push(element)
                }
            }
        }
        return retArr
    }
    async startNextServer() {
        //console.log('Start Server');
        var notrunningServers = this.getNotRunningServer()
        //console.log('startNextServer notrunningServers:', notrunningServers.length);
        if (notrunningServers.length > 0) {
            await notrunningServers[0].start()
            await notrunningServers[0].getStatus()
            return true
        } else {
            console.log('Kann keinen weiteren Server Starten');
        }
        return false
    }
    getServerWithLowestReqPerSec() {
        var ret = 0
        for (let index = 0; index < this.runningServers.length; index++) {
            const element = this.runningServers[index];
            if (index == 0) {
                ret = index
            }
            if (element.connections < this.runningServers[ret].connections) {
                ret = index
            }
        }
        //console.log(servers[ret]);
        return this.runningServers[ret]
    }
    calcAllReqPerSec() {
        var reqPerSec = {}
        var keyArray = Object.keys(this.secServers);
        for (let index = 0; index < keyArray.length; index++) {
            const key = keyArray[index];
            const element = this.secServers[key];
            reqPerSec[key] = element.calcReqPerSec();
        }
        return reqPerSec;
    }
}

class SecondaryServer {

    constructor(data) {
        this.host = data.host;
        this.exec_port = data.exec_port;
        this.webserver_port = data.webserver_port;
        this.socket = null;
        this.connections = 0;
        this.maxConnectionsPerSec = 10
        this.lastReqPerSec = 0;
        this.status = { webServer: { killed: null, exitCode: null, signalCode: null, running: false }, execServer: { connected: false } }
    }
    connect() {
        var that = this;
        return new Promise(function (resolve, reject) {

            try {
                //console.log('SIOC Try Connect to: ', "http://" + that.host + ":" + that.exec_port);
                that.socket = ioc("http://" + that.host + ":" + that.exec_port);
                that.socket.on("connect", () => {
                    //console.log("connect", that.socket.id); // x8WIv7-mJelg7on_ALbx

                    that.socket.emit('getWebServerStatus', (status) => {
                        //console.log('status : ', status);
                        that.status = status
                        that.status.webServer.running = !status.webServer.killed && status.webServer.exitCode == null && status.webServer.signalCode == null;
                        //console.log("statusChanged : ", status); // x8WIv7-mJelg7on_ALbx
                        that.emit('statusChanged', that);
                    });
                    resolve(true);
                });

                that.socket.on("statusChanged", (status) => {
                    that.status = status;
                    that.status.webServer.running = !status.webServer.killed && status.webServer.exitCode == null && status.webServer.signalCode == null;
                    //console.log("statusChanged : ", that.status); // x8WIv7-mJelg7on_ALbx
                    that.emit('statusChanged', that);
                    //changeServer
                });

                that.socket.on("disconnect", (status) => {
                    console.log("disconnect");
                    //var status = { webServer: { running: false }, execServer: { connected: false } }
                    //that.status = status;
                    that.status.webServer.running = false;
                    that.status.execServer.connected = false;
                    //console.log("statusChanged : ", status); // x8WIv7-mJelg7on_ALbx
                    that.emit('statusChanged', that);
                    //changeServer
                });

                that.socket.on('connect_failed', function () {
                    console.log("Sorry, there seems to be an issue with the connection!");
                    reject();
                })


            } catch (error) {
                console.log('SocketIO Client Error: ', error);
                reject(error);
            }
        })
    }
    calcReqPerSec() {
        this.lastReqPerSec = this.connections
        this.connections = 0;
        return this.lastReqPerSec;
    }
    changehost(ip, exec_port, webserver_port) {
        this.webserver_port = webserver_port;
        this.exec_port = exec_port;
        this.host = ip;
        console.log(this);
        this.connect();
    }
    addConnection(data) {
        this.connections[data.id] = data;
    }
    removeConnection(id) {
        //this.connectionHistory[id] = this.connections[id];
        delete this.connections[id];
    }
    start() {
        return new Promise((resolve, reject) => {
            this.socket.emit('start', (data) => {
                console.log('Server Started = ', data);
                resolve(data)
            });
        })

    }
    stop() {
        this.socket.emit('stop');
    }
    getStatus() {
        return new Promise((resolve, reject) => {
            //console.log('getStatus = ', this.socket.connected);
            if (!this.socket.connected) {
                this.status = { webServer: { killed: null, exitCode: null, signalCode: null }, execServer: { connected: false } }
                //this.status.webServer.running = !this.status.webServer.killed && this.status.webServer.exitCode == null && this.webServer.signalCode == null;
                this.status.webServer.running = false;
                resolve(this.status)
            } else {
                this.socket.emit('status', (status) => {
                    //console.log('getStatus : ', status);
                    this.status = status
                    this.status.webServer.running = !status.webServer.killed && status.webServer.exitCode == null && status.webServer.signalCode == null;
                    resolve(status)
                });
            }

        })

    }
}

util.inherits(SecondaryServerManager, EventEmitter);
util.inherits(SecondaryServer, EventEmitter);

module.exports.SecondaryServerManager = SecondaryServerManager;
module.exports.SecondaryServer = SecondaryServer;
module.exports.ioc = ioc;
module.exports.uuidv4 = uuidv4;