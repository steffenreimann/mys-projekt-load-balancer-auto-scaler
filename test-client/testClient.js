
const cluster = require('cluster');
const http = require('http');
const { exit } = require('process');
const numCPUs = require('os').cpus().length; //number of CPUS
var gesammtReq = 0;
var startDate = new Date();
var exited = 0;

var reqPerThread = 1000
var threads = 24

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

    if (exited == threads - 1) {
      var endDate = new Date();
      var timeneeded = endDate - startDate;
      var gesamtReq = reqPerThread * threads
      var reqpersek = gesamtReq / (timeneeded / 1000)
      console.log(gesamtReq, ' anfragen wurden erfolgreich beantwortet.', timeneeded / 1000);
      console.log(reqpersek, ' per sek.');
    }
    exited++
  });



  cluster.on('fork', function (worker) {
    worker.on('message', (msg) => {
      console.log('Worker to master: ', msg);
    });
  });

  //worker.send({ chat: 'Ok worker, Master got the message! Over and out!' });


} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server

  async function reqLoop(hinternander) {
    var i = 0;

    while (i < hinternander) {
      if (!await req()) {
        console.log('Fehler!');
      }
      gesammtReq++;
      console.log('worker id : ', cluster.worker.id, ' / Req : ', i);
      i++
    }
    return
  }

  async function req() {
    try {
      var res = await fetch('http://localhost')
      // Do something with response
      //console.log("response -", await res.text());
      return res.ok
    } catch (error) {
      console.log(error);
      return false
    }

  }

  async function init(hinternander) {
    await reqLoop(hinternander)
    exit()
  }

  init(reqPerThread)

}