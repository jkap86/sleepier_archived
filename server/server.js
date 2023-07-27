'use strict'

const throng = require('throng');
const WORKERS = process.env.WEB_CONCURRENCY || 1;

throng({
    worker: start,
    count: WORKERS
});

function start() {
    const express = require('express');
    const cors = require('cors');
    const compression = require('compression');
    const path = require('path');
    const NodeCache = require('node-cache');
    const home_cache = new NodeCache();
    const user_cache = new NodeCache();

    const app = express();

    // Object to store the IP addresses and their request count
    const requestCounts = {};

    // Array to store temporarily blocked IP addresses
    const blockedIPs = [];

    // Custom middleware to block IP addresses
    const blockIPMiddleware = (req, res, next) => {
        /*
        const clientIP = req.ip;
        console.log({ IP: clientIP })
        const currentTime = Date.now();

        // Check if IP is blocked
        if (blockedIPs.includes(clientIP)) {
            console.log(`${clientIP} blocked...`)
            return res.status(403).send('Access denied: Your IP is blocked.');
        }

        // Initialize request count for IP if not present
        if (!requestCounts[clientIP]) {
            requestCounts[clientIP] = {
                count: 1,
                lastRequestTime: currentTime,
            };
            next();
        } else {
            const { count, lastRequestTime } = requestCounts[clientIP];
            const timeDifference = currentTime - lastRequestTime;

            // Check if the IP has made more than 5 requests within 5 seconds
            if (count >= 10 && timeDifference < 30000) {
                blockedIPs.push(clientIP);
                delete requestCounts[clientIP];
                setTimeout(() => {
                    blockedIPs.splice(blockedIPs.indexOf(clientIP), 1);
                }, 5 * 60 * 1000); // Unblock the IP after 1 hour
                return res.status(429).send('Too many requests. Please try again later.');
            } else if (timeDifference >= 30000) {
                // Reset request count and last request time after 5 seconds
                requestCounts[clientIP].count = 1;
                requestCounts[clientIP].lastRequestTime = currentTime;
            } else {
                // Increment the request count if less than 5 seconds have passed
                requestCounts[clientIP].count += 1;
            }
            next();
        }
        */

        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    };

    // Apply the blockIPMiddleware to all routes
    app.use(blockIPMiddleware);



    app.use(compression())
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.resolve(__dirname, '../client/build')));


    const db = require('./app/models');
    db.sequelize.sync({ alter: true })
        .then(() => {
            console.log("Synced db.");
        })
        .catch((err) => {
            console.log("Failed to sync db: " + err.message);
        })


    require("./app/routes/user.routes")(app, home_cache, user_cache);
    require('./app/routes/league.routes')(app, home_cache, user_cache)
    require('./app/routes/home.routes')(app, home_cache)
    require('./app/routes/dynastyrankings.routes')(app)
    require('./app/routes/trade.routes')(app)
    require('./app/routes/ringOfFire.routes')(app, home_cache)
    require('./app/routes/projections.routes')(app, home_cache)

    app.get('*', async (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    })

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);

        require('./app/backgroundTasks/onServerBoot')(home_cache)
        require('./app/backgroundTasks/findMostLeagus')(app)
        require('./app/backgroundTasks/getProjections')(home_cache)
    });

}