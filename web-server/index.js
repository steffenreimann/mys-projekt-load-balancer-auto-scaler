const express = require('express')
const app = express()
const cluster = require('cluster');
const http = require('http');
const { exit } = require('process');
const numCPUs = require('os').cpus().length; //number of CPUS
//var threads = 6
var threads = numCPUs


cluster.schedulingPolicy = cluster.SCHED_RR

if (cluster.isMaster) {
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

    cluster.on('fork', function (worker) {
        worker.on('message', (msg) => {
            console.log('Worker to master: ', msg);
        });
    });

    //worker.send({ chat: 'Ok worker, Master got the message! Over and out!' });


} else {

    app.use(function (req, res, next) {
        req.setTimeout(1000, function () {
            // call back function is called when request timed out.
            console.log('Timeout!');
        });
        next();
    });

    app.get('/', async (req, res) => {
        //await wait(2000);
        //console.log('Get / response ...', cluster.worker.id);
        res.setHeader('Connection', 'close');
        //res.send('worker.id: ' + cluster.worker.id + ' / You are on Webserver: ' + args.webp)
        res.end('worker.id: ' + cluster.worker.id + ' / You are on Webserver: ' + args.webp);
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

}