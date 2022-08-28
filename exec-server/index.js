const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 8081;
const { exec, spawn } = require('child_process');

app.get('/', function (req, res) {
    res.send('Hello World! Server 1')
});
server.listen(port, function () {
    console.log(`Listening on port ${port}`);
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

    client.on('start', () => {
        console.log('start: ');
        startServer(client);
    });
    client.on('stop', () => {
        console.log('stop: ');
        stopServer()
    });

    client.on('getWebServerStatus', (cb) => {
        if (serverProcess != null) {
            console.log('getWebServerStatus pid : ', serverProcess.pid);
            console.log('getWebServerStatus killed : ', serverProcess.killed);
            console.log('getWebServerStatus exitCode : ', serverProcess.exitCode);
            console.log('getWebServerStatus signalCode : ', serverProcess.signalCode);
            cb(0)
        } else {
            cb(-1)
        }


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

    //console.log('Start Server Process: ', serverProcess);

    if (serverProcess != null) {
        console.log('Web Server Allready running!');
        return;
    }
    //console.log('Start Web Server');
    var pathToEXEC = path.resolve('../web-server/index.js');
    console.log('Start Web Server', pathToEXEC);

    //var child = spawn('node', ['src/server/single.js','app='+name,'build=complete', 'incrementVersion=true', 'uploadBuild=true']);
    serverProcess = spawn('node', [pathToEXEC]);

    serverProcess.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
        addLog(data)
    });

    serverProcess.stderr.on('data', (data) => {
        //console.error(`stderr: ${data}`);
        addLog(data)
    });
    // serverProcess.stdin.write('abc123!' + "\n")
    serverProcess.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
        //cb({ code: code })
    });
}

function stopServer(params) {
    serverProcess.exit();
}

