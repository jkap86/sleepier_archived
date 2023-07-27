'use strict'

module.exports = app => {
    const rateLimit = require('express-rate-limit');
    const dynastyrankings = require("../controllers/dynastyrankings.controller.js");

    const dynastyrankingsLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10
    })

    var router = require("express").Router();

    router.post("/stats", dynastyrankingsLimiter, dynastyrankings.stats)

    router.post("/find", dynastyrankingsLimiter, dynastyrankings.find)

    router.post("/findrange", dynastyrankingsLimiter, dynastyrankings.findrange)

    app.use('/dynastyrankings', router);
}