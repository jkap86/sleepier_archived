'use strict'

module.exports = app => {
    const dynastyrankings = require("../controllers/dynastyrankings.controller.js");

    var router = require("express").Router();

    router.post("/stats", dynastyrankings.stats)

    router.post("/find", dynastyrankings.find)

    router.post("/findrange", dynastyrankings.findrange)

    app.use('/dynastyrankings', router);
}