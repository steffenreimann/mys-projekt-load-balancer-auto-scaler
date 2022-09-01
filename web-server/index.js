const express = require('express')
const app = express()



app.use(function (req, res, next) {
    req.setTimeout(1000, function () {
        // call back function is called when request timed out.
        console.log('Timeout!');
    });
    next();
});

app.get('/', async (req, res) => {
    //await wait(2000);
    //console.log('Get / response ...');
    res.send('Hello World! You are on Webserver' + args.webp)
})

app.get('/end', (req, res) => {
    process.exit(-1)
})


function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

var args = { webp: 3000 }

function init(params) {
    var arr = process.argv
    console.log(process.argv);

    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        if (element == 'webp') {
            args.webp = Number(arr[index + 1])
        }
    }

    app.listen(args.webp, () => {
        console.log('ready');
        console.log(`Example app listening on port ${args.webp}`)
    })

}

init();