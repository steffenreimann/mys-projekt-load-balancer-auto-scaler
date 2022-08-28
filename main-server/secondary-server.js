
const { v4: uuidv4 } = require('uuid');
const ioc = require("socket.io-client");

class SecondaryServerManager {
    constructor() {
        this.secServers = {}
    }
    addServer(secServer) {
        var id = uuidv4();
        this.secServers[id] = secServer
    }
    removeServerById(id) {
        this.secServer[id].dispose();
        delete this.secServers[id];
    }
    getServerByIndex(id) {
        return this.secServers[id];
    }
    getBestServer() {
        return Object.values(this.secServers)[0]
    }
}

class SecondaryServer {

    constructor(data) {
        this.host = data.host;
        this.exec_port = data.exec_port;
        this.webserver_port = data.webserver_port;
        this.socket = null;
        this.connections = {};
        this.connectionHistory = {};
    }
    connect() {
        var that = this;
        return new Promise(function (resolve, reject) {

            try {
                console.log('SIOC Try Connect to: ', "http://" + that.host + ":" + that.exec_port);
                that.socket = ioc("http://" + that.host + ":" + that.exec_port);
                that.socket.on("connect", () => {
                    console.log("connect", that.socket.id); // x8WIv7-mJelg7on_ALbx

                    that.socket.emit('getWebServerStatus', (status) => {
                        console.log('status : ', status);
                    });


                    resolve(true)
                });
                that.socket.on('connect_failed', function () {
                    console.log("Sorry, there seems to be an issue with the connection!");
                    reject()
                })


            } catch (error) {
                console.log('SocketIO Client Error: ', error);
                reject(error)
            }
        })
    }
    addConnection(data) {
        this.connections[data.id] = data;
    }
    removeConnection(id) {
        this.connectionHistory[id] = this.connections[id];
        delete this.connections[id]
    }
    start() {
        this.socket.emit('start');
    }
    stop() {
        this.socket.emit('stop');
    }
}

module.exports.SecondaryServerManager = SecondaryServerManager;
module.exports.SecondaryServer = SecondaryServer;
module.exports.ioc = ioc;
module.exports.uuidv4 = uuidv4;