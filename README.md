# mys-projekt-load-balancer-auto-scaler

## Main Server 
der config server erhält in der regel einen port um 8080
der forward server erhält in der regel einen port um 80

## Execute Server
der Execute server erhält in der regel einen port um 7070

```
node .\index.js -exep 7070 -webp 6060
node .\index.js -exep 7071 -webp 6061
node .\index.js -exep 7072 -webp 6062
node .\index.js -exep 7073 -webp 6063
```


## Web Server 
der web server erhält in der regel einen port um 6060