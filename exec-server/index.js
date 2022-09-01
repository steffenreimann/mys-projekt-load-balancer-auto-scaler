const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { exec, spawn } = require('child_process');
const { resolve } = require('path');




app.get('/', function (req, res) {
    res.send('Hello World! Server 1')
});


io.on('connection', client => {
    console.log("Connection", client.id);
    client.on('event', data => {
        /* … */
    });

    client.on('exec', (data, cb) => {
        console.log('exec: ', data);
        //{code: code ,error: error,stdout:stdout,stderr:stderr }
        /*         const child = exec(data, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: ' + error.code);
                        console.log('Signal received: ' + error.signal);
                    }
                    console.log('Child Process STDOUT: ' + stdout);
                    console.log('Child Process STDERR: ' + stderr);
                    cb({ error: error, stdout: stdout, stderr: stderr })
                });
                child.stdin.write('abc123!' + "\n")
                child.on('exit', function (code) {
                    console.log('Child process exited with exit code ' + code);
                    //cb({ code: code })
                }); */

    });

    client.on('start', (cb) => {
        console.log('start: ');
        startServer(client).then((data) => {
            cb(data)
        });
    });
    client.on('stop', () => {
        console.log('stop: ');
        stopServer()
    });

    client.on('status', (cb) => {
        if (serverProcess != null) {
            var ret = { webServer: { killed: serverProcess.killed, exitCode: serverProcess.exitCode, signalCode: serverProcess.signalCode }, execServer: { connected: true } }
        } else {
            var ret = { webServer: { killed: true, exitCode: -1, signalCode: -1 }, execServer: { connected: true } }
        }

        console.log('status: ', ret);
        cb(ret)
    });

    client.on('getWebServerStatus', (cb) => {

        var status

        if (serverProcess != null) {
            status = { webServer: { killed: serverProcess.killed, exitCode: serverProcess.exitCode, signalCode: serverProcess.signalCode }, execServer: { connected: true } }
        } else {
            status = { webServer: { killed: true, exitCode: -1, signalCode: -1 }, execServer: { connected: true } }
        }
        //console.log(status);
        io.emit('statusChanged', status)

        cb(status)

        /*         if (serverProcess != null) {
                    console.log('getWebServerStatus pid : ', serverProcess.pid);
                    console.log('getWebServerStatus killed : ', serverProcess.killed);
                    console.log('getWebServerStatus exitCode : ', serverProcess.exitCode);
                    console.log('getWebServerStatus signalCode : ', serverProcess.signalCode);
                    cb(0)
                } else {
                    cb(-1)
                } */


    })
    client.on('disconnect', () => {
        console.log("disconnect");
    });
});


var startCMD = {
    cmd: ""
}

var path = require('path');
var serverProcess = null;
var logs = []

function addLog(data) {
    logs.push({ log: data, date: new Date() })
    console.log(`addLog: ${data}`);
    if (logs.length > 50) {
        logs.shift();
    }
}

function startServer(client) {
    return new Promise((resolve, reject) => {


        //console.log('Start Server Process: ', serverProcess);


        if (serverProcess != null) {
            console.log('Start Server Process signalCode: ', serverProcess.signalCode);
            console.log('Start Server Process exitCode: ', serverProcess.exitCode);
            console.log('Start Server Process killed: ', serverProcess.killed);
            if (serverProcess.signalCode != null || serverProcess.exitCode != null || serverProcess.killed) {
                console.log('Web Server läuft nicht und wird gestartet!');

            } else {
                console.log('Web Server Allready running!');
                resolve(true);
                return;
            }

        }
        //console.log('Start Web Server');
        var pathToEXEC = path.resolve('../web-server/index.js');
        //console.log('Start Web Server', pathToEXEC);

        //var child = spawn('node', ['src/server/single.js','app='+name,'build=complete', 'incrementVersion=true', 'uploadBuild=true']);
        serverProcess = spawn('node', [pathToEXEC, 'webp', args.webp]);

        serverProcess.stdout.on('data', (data) => {
            var sdata = arrayBufferToString(data).trim()
            console.log(`stdout: ${data}`);
            //console.log('raw ', data);
            //console.log('string ', sdata);
            //console.log('typeof sdata ', typeof sdata);
            //console.log('sdata == ready ', sdata == 'ready');
            //addLog(data)

            if (sdata == 'ready') {
                console.log('statusChanged ready')
                statusChanged()
                resolve(true);
            }
            //resolve();
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            addLog(data)
            resolve(false);
        });
        // serverProcess.stdin.write('abc123!' + "\n")
        serverProcess.on('exit', function (code) {
            statusChanged()
            console.log('Child process exited with exit code ' + code);
            //cb({ code: code })
            resolve(false);
        });

    })
}

function stringToArrayBuffer(str) {
    if (/[\u0080-\uffff]/.test(str)) {
        throw new Error("this needs encoding, like UTF-8");
    }
    var arr = new Uint8Array(str.length);
    for (var i = str.length; i--;)
        arr[i] = str.charCodeAt(i);
    return arr.buffer;
}
function arrayBufferToString(buffer) {
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if (/[\u0080-\uffff]/.test(str)) {
        throw new Error("this string seems to contain (still encoded) multibytes");
    }
    return str;
}

function stopServer(params) {
    try {
        serverProcess.kill();
    } catch (error) {
        console.log(error);
    }

}

var args = { exep: 7070, webp: 6060 }

function init(params) {
    var arr = process.argv
    //console.log(process.argv);

    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        if (element == '-exep') {
            args.exep = Number(arr[index + 1])
        } else if (element == '-webp') {
            args.webp = Number(arr[index + 1])
        }
    }

    server.listen(args.exep, function () {
        console.log(`Listening on port ${args.exep}`);
    });
}

function statusChanged() {
    var status

    if (serverProcess != null) {
        status = { webServer: { killed: serverProcess.killed, exitCode: serverProcess.exitCode, signalCode: serverProcess.signalCode }, execServer: { connected: true } }
    } else {
        status = { webServer: { killed: true, exitCode: -1, signalCode: -1 }, execServer: { connected: true } }
    }
    //console.log(status);
    io.emit('statusChanged', status)
}

init();