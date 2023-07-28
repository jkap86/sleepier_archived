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

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);


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