'use strict'

module.exports = (app, home_cache) => {

    var router = require("express").Router();

    router.get("/", (req, res) => {
        const state = home_cache.get('state')
        const allplayers = home_cache.get('allplayers')
        const schedule = home_cache.get('schedule')
        const projections = home_cache.get('projections')
        res.send({
            state: state,
            allplayers: allplayers,
            schedule: schedule,
            projections: projections
        })
    })



    app.use('/home', router);
}