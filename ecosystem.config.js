module.exports = {
  apps: [
    {
      name: "execs",
      script: "./exec-server/index.js",
      args: '-exep 7070 -webp 6060',
      watch: true,
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: ["node_modules"],
    },
    {
      name: "mains",
      script: "./main-server/main-server.js",
      watch: ["./main-server"],
      // Delay between restart
      watch_delay: 1000,
      ignore_watch: ["node_modules"],
    }]
}