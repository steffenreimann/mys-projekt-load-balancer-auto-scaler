var socket = io.connect();

socket.on('connect', function (msg) {
    console.log('Connect', socket.id);

});

async function getSecondaryServer() {
    var secserver = await emit('getSecondaryServer')
    console.log('secserver : ', secserver);
    renderServer(secserver)
}

function renderServer(data) {

    var secserver = document.getElementById('renderedSecServer')
    secserver.innerHTML = "";
    var keyArray = Object.keys(data);
    for (let index = 0; index < keyArray.length; index++) {
        var secservertemp = document.getElementById('secserver').cloneNode(true).content.children[0];

        const key = keyArray[index];
        const element = data[key];

        secservertemp.querySelector('#serverip').innerHTML = element.host;

        secserver.appendChild(secservertemp)
    }

}


function emit(event, data) {
    return new Promise((resolve, reject) => {
        data = data || {}
        socket.emit(event, data, (resdata) => {
            resolve(resdata)
        })
    })
}