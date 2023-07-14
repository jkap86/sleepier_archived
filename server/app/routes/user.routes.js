module.exports = (app, home_cache, user_cache) => {
    const users = require("../controllers/user.controller.js");
    const leagues = require("../controllers/league.controller.js");

    var router = require("express").Router();


    router.post("/create",
        (req, res, next) => {
            users.create(req, res, next, home_cache, user_cache)
        },
        (req, res) => {
            leagues.find(req, res, home_cache, user_cache)
        })


    router.post("/findmostleagues", (req, res) => {
        const users = app.get('top_users')
        res.send(users || [])
    })

    app.use('/user', router);
}