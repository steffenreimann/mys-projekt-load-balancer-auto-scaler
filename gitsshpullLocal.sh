git reset --hard HEAD 
git pull 
pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs"