rem echo off

rem ssh -t -p 3164 sr-projekt-load-balancer@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "mains""

rem ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs""

ssh -t -p 3182 sr-projekt-execs-2@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/.nvm/versions/node/v18.0.0/lib/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs""

rem ssh -p 3182 sr-projekt-execs-2@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler; sh gitsshpullLocal.sh"

rem ssh -t -p 3151 sr-projekt-execs-3@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs""

rem ssh -t -p 3172 sr-projekt-execs-4@h2899502.stratoserver.net "cd ~/mys-projekt-load-balancer-auto-scaler ; git reset --hard HEAD && git pull && ~/node_modules/pm2/bin/pm2 start ~/mys-projekt-load-balancer-auto-scaler/ecosystem.config.js --only "execs""


rem ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "~/node_modules/pm2/bin/pm2 list"

rem ssh -t -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "ls ~/mys-projekt-load-balancer-auto-scaler/"
rem ssh -t -p 3164 sr-projekt-load-balancer@h2899502.stratoserver.net "ls ~/.nvm/versions/node/v18.0.0/lib/node_modules/pm2/bin/pm2 list"

rem ssh -p 3182 sr-projekt-execs-2@h2899502.stratoserver.net "echo ~/mys-projekt-load-balancer-auto-scaler/gitsshpullLocal.sh" 
rem ssh -p 3154 sr-projekt-execs-1@h2899502.stratoserver.net "bash ~/mys-projekt-load-balancer-auto-scaler/gitsshpullLocal.sh" 