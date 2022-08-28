const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World! You are on Webserver1')
})

app.get('/end', (req, res) => {
    process.exit(-1)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})