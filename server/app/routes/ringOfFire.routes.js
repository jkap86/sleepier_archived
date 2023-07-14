'use strict'

module.exports = (app, home_cache) => {
    const rof = require('../controllers/ringOfFire.controller.js')

    var router = require("express").Router();

    router.get('/home', async (req, res) => {
        rof.home(req, res, home_cache)
    })

    router.post('/standings', rof.standings)

    app.use('/rof', router);
}