'use strict'

module.exports = app => {
    const rateLimit = require('express-rate-limit');
    const dynastyrankings = require("../controllers/dynastyrankings.controller.js");
    const { logMemUsage } = require('../helpers/logMemUsage.js');

    const dynastyrankingsLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10
    })

    var router = require("express").Router();

    router.post("/stats", dynastyrankingsLimiter, logMemUsage, dynastyrankings.stats)

    router.post("/find", dynastyrankingsLimiter, logMemUsage, dynastyrankings.find)

    router.post("/findrange", dynastyrankingsLimiter, logMemUsage, dynastyrankings.findrange)

    app.use('/dynastyrankings', router);
}