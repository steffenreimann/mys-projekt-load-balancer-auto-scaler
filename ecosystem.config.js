module.exports = {
  apps: [
    {
      name: "execs",
      script: "./exec-server/index.js",
      args: '-exep 1234 -webp 6060',
    },
    {
      name: "mains",
      script: "./main-server/main-server.js"

    }]
}