echo ~/mys-projekt-load-balancer-auto-scaler/
cd ~/mys-projekt-load-balancer-auto-scaler 
git reset --hard HEAD ~/mys-projekt-load-balancer-auto-scaler/

git pull ~/mys-projekt-load-balancer-auto-scaler/
~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs"