var socket = io.connect();

socket.on('connect', function (msg) {
    console.log('Connect', socket.id);
    init()


});

socket.on('reqPerSec', function (msg) {
    console.log('reqPerSec', msg);
    var date = new Date()
    for (const key in msg) {
        if (Object.hasOwnProperty.call(msg, key)) {
            const element = msg[key];
            if (key != 'main') {
                document.querySelector('#reqpersec-' + key).innerHTML = element
            }
        }
    }

    addData(myChart, '', { x: date, y: msg.main })
});

socket.on('statusChanged', function (key, status) {
    //main_server_io.emit('statusChanged', key, data.status);
    console.log('changeServer', key, status);

    var secservertemp = document.getElementById(key)
    console.log(secservertemp);

    secservertemp.querySelector('#statusexecServer').innerHTML = status.execServer.connected;
    secservertemp.querySelector('#webserverrunning').innerHTML = status.webServer.running;
    //addData(myChart, '', { x: date, y: msg.main })
});

function init() {
    getSecondaryServer()
    beforePrintHandler()
}

function beforePrintHandler() {
    for (let id in Chart.instances) {
        Chart.instances[id].resize();
    }
}

window.addEventListener('beforeprint', () => {
    console.log('beforeprint');
    myChart.resize(600, 600);
});
window.addEventListener('afterprint', () => {
    console.log('afterprint');
    myChart.resize();
});

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });

    chart.update();
    removeData(chart)
}

function removeData(chart) {
    //chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        if (dataset.data.length > 60) {
            dataset.data.shift();
            chart.data.labels.shift();
        }
    });
    chart.update();
}


async function getSecondaryServer() {
    var secserver = await emit('getSecondaryServer')
    console.log('secserver : ', secserver);
    renderServer(secserver)
}

function renderServer(data) {

    /*     'dd2fb682-b48c-4f7d-be03-922282cfc59c': {
            status: { webServer: [Object], execServer: 'no connection' },
            connections: {},
            connectionHistory: {},
            host: '192.168.178.23',
            exec_port: 8090,
            webserver_port: 3000 */


    var secserver = document.getElementById('renderedSecServer')
    secserver.innerHTML = "";
    var keyArray = Object.keys(data);
    for (let index = 0; index < keyArray.length; index++) {
        const key = keyArray[index];
        const element = data[key];
        test(secserver, key, element, data)
    }
}

function test(secserver, key, element, data) {
    var secservertemp = document.getElementById('secserver').cloneNode(true).content.children[0];


    secservertemp.id = key;
    secservertemp.querySelector('#editSecServerConfigHost').value = element.host;
    secservertemp.querySelector('#editSecServerConfigPort').value = element.exec_port;
    secservertemp.querySelector('#editSecServerWebPort').value = element.webserver_port;

    /*         <!-- var ret = { webServer: { killed: serverProcess.killed, exitCode: serverProcess.exitCode, signalCode: serverProcess.signalCode }, execServer: 'running' } -->
    
            <p id="status.webServer.killed"></p>
            <p id="status.webServer.exitCode"></p>
            <p id="status.webServer.signalCode"></p>
            <p id="status.execServer"></p */
    console.log(element.status.webServer.killed);
    secservertemp.querySelector('#serverid').innerHTML = key;
    secservertemp.querySelector('#statusexecServer').innerHTML = element.status.execServer.connected;
    secservertemp.querySelector('#webserverrunning').innerHTML = element.status.webServer.running;
    secservertemp.querySelector('#reqpersec').innerHTML = '0';
    secservertemp.querySelector('#reqpersec').id = 'reqpersec-' + key

    secservertemp.querySelector('#saveButton').onclick = async () => {
        var ret = {}
        ret.host = secservertemp.querySelector('#editSecServerConfigHost').value
        ret.exec_port = secservertemp.querySelector('#editSecServerConfigPort').value
        ret.webserver_port = secservertemp.querySelector('#editSecServerWebPort').value
        ret.id = key
        console.log('save : ', ret, secservertemp);


        console.log(await emit('saveSecServer', ret));
    }
    secservertemp.querySelector('#startButton').onclick = async () => {
        var ret = { id: key }
        console.log('startButton : ', ret);

        await emit('startwebserver', ret)
    }
    secservertemp.querySelector('#stopButton').onclick = async () => {
        var ret = { id: key }
        console.log('stopButton : ', ret);
        await emit('stopwebserver', ret)
    }

    secserver.appendChild(secservertemp)
}

async function addSecServer() {
    var config = {
        host: "192.168.178.23",
        exec_port: 8081,
        webserver_port: 3000,
        prio: 0
    }
    //console.log();
    config.host = document.querySelector('#addSecServerConfigHost').value
    config.exec_port = Number(document.querySelector('#addSecServerConfigPort').value)
    config.webserver_port = Number(document.querySelector('#addSecServerWebPort').value)

    var servers = await emit('addSecServer', config);
    console.log(servers);
}

function emit(event, data) {
    return new Promise((resolve, reject) => {
        data = data || {}
        socket.emit(event, data, (resdata) => {
            resolve(resdata)
        })
    })
}