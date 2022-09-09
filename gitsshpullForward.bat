ssh -t -p 3164 sr-projekt-load-balancer@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull"

ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs" --node-args="dev --exep=1234""

ssh -t -p 3182 sr-projekt-execs-2@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull"

ssh -t -p 3151 sr-projekt-execs-3@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull"

ssh -t -p 3172 sr-projekt-execs-4@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull"


rem ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "~/node_modules/pm2/bin/pm2 list"

rem ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "ls ~/mys-projekt-load-balancer-auto-scaler/"