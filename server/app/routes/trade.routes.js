'use strict'

module.exports = app => {
    const rateLimit = require('express-rate-limit');
    const trades = require("../controllers/trade.controller.js");

    const tradeLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10
    })

    var router = require("express").Router();

    router.post('/leaguemate', tradeLimiter, trades.leaguemate)

    router.post('/pricecheck', trades.pricecheck)

    app.use('/trade', router);
}