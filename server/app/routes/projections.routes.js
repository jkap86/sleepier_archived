'use strict'

module.exports = (app, home_cache) => {
    const projections = require('../controllers/projections.controller.js');
    const router = require('express').Router();

    router.post('/fetch', (req, res) => {
        projections.fetch(req, res, home_cache)
    });

    app.use('/projections', router);
}