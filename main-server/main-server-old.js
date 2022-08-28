//172.24.140.102

const express = require('express')
const app = express()
const port = 3000
const {
    NodeSSH
} = require('node-ssh')
const ssh = new NodeSSH();
var fs = require('fs');
var key = ""
const {
    v4: uuidv4
} = require('uuid');


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var privateKey = fs.readFileSync(getUserHome() + '/.ssh/id_rsa', 'utf8');



// Display the file content
//console.log(data);

/* ssh.connect({
    //host: "h2899502.stratoserver.net",
    host: "85.214.194.29",
    username: "root",
    privateKey: privateKey,
    passphrase: "ajstiv"
}).then(() => {
    ssh.execCommand('echo hallo').then((result) => {
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
    });
    ssh.execCommand('docker -v').then((result) => {
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
    });
}); */

class SecServerManager {
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
    getServerByIndex(index) {
        return -1;
    }
}

class SecServer {
    constructor(data) {
        this.host = data.host;
        this.username = data.username;
        this.privateKey = data.privateKey;
        //this.passphrase = "abc123!";
        this.password = "abc123!";
        this.prio = data.prio || 0;
        this.ssh = new NodeSSH();

    }
    async connect() {
        try {
            await this.ssh.connect({
                host: this.host,
                username: this.username,
                port: 22,
                privateKey: this.privateKey,
                tryKeyboard: true,
                password: this.password,
                onKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
                    console.log('onKeyboardInteractive');
                    if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
                        finish([this.password])
                    }
                }
            });
            console.log("Connect SSH");
            console.log(this.ssh.isConnected());
            if (this.ssh.isConnected()) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error);
            return false
        }
    }
    async getSecServerDockerInfos() {
        try {
            var result = await this.ssh.execCommand('docker version --format "{{json .}}"')
            var resultJSON = JSON.parse(result.stdout)
            return resultJSON
        } catch (error) {
            return null;
        }
    }

    async testpw() {

        var result = await this.ssh.execCommand('echo hallo', {
            options: {
                stdin: this.password + '\n',
                pty: true
            }
        })
        console.log('installDocker 1 : ');
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        if (result.stderr) return -1;
    }

    async installDocker() {
        //sudo apt-get update
        var result = await this.ssh.execCommand('sudo', ['apt-get', 'update'], {
            options: {
                stdin: this.password + '\n',
                pty: true
            }
        })
        console.log('installDocker 1 : ');
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        if (result.stderr) return -1;

        result = await this.ssh.execCommand('sudo apt-get install \
        ca-certificates \
        curl \
        gnupg \
        lsb-release', {
            stdin: this.password + '\n',
            pty: true
        })

        console.log('installDocker 2 : ');
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        if (result.stderr) return -1;

        result = await this.ssh.execCommand('sudo', ['mkdir -p /etc/apt/keyrings'], {
            execOptions: {
                pty: true
            },
            stdin: 'abc123!\n'
        })

        console.log('installDocker 3 : ');
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        if (result.stderr) return -1;

        result = await this.ssh.execCommand('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg')

        console.log('installDocker 4 : ');
        console.log('STDOUT: ' + result.stdout);
        console.log('STDERR: ' + result.stderr);
        if (result.stderr) return -1;


    }

}

var secServerManager = new SecServerManager();

async function initServers() {
    var secServer = [{
        //host: "85.214.194.29",
        host: "192.168.178.35",
        port: 22,
        username: "secserver",
        privateKey: privateKey,
        //passphrase: "abc123!",
        password: "abc123!",
        prio: 0
    }]

    for (let index = 0; index < secServer.length; index++) {
        const secs = new SecServer(secServer[index])
        var connected = await secs.connect();
        console.log("connected = ", connected);
        if (connected) {
            secServerManager.addServer(secs);
            var dockerinfo = await secs.getSecServerDockerInfos()
            secs.testpw()
            if (dockerinfo == null) {

                //secs.installDocker()
            }
            console.log();
        }
    }
}





initServers();