async testpw() {

    var result = await this.ssh.execCommand('echo hallo', {
        options: {
            stdin: this.password + '\n',
            pty: true
        }
    })
    console.log('installDocker 1 : ');
    console.log('STDOUT: ' + JSON.stringify(result));
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

async getSecServerDockerInfos() {
    try {
        var result = await this.ssh.execCommand('docker version --format "{{json .}}"')
        var resultJSON = JSON.parse(result.stdout)
        return resultJSON
    } catch (error) {
        return null;
    }
}