'use strict'

module.exports = (app, home_cache, user_cache) => {
    const leagues = require("../controllers/league.controller.js");

    const router = require("express").Router();

    router.post('/find', (req, res) => {
        leagues.find(req, res, home_cache)
    });

    router.post('/sync', (req, res) => {
        leagues.sync(req, res, home_cache, user_cache)
    })

    router.post("/draft", async (req, res) => {
        leagues.picktracker(req, res, home_cache)
    })

    app.use('/league', router);
}