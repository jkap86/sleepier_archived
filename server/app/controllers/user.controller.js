'use strict'
const db = require("../models");
const Sequelize = db.Sequelize;
const sequelize = db.sequelize;
const User = db.users;
const Op = db.Sequelize.Op
const League = db.leagues;
const leagues = require('../controllers/league.controller.js');
const axios = require('../api/axiosInstance');
const projections_json = require('../../projections.json');
const allplayers_json = require('../../allplayers.json');
const schedule_json = require('../../schedule.json');

exports.create = async (req, res, next, home_cache, user_cache) => {
    console.log(`***SEARCHING FOR ${req.body.username}***`)

    const user_from_cache = user_cache.get(req.body.username.toLowerCase())

    if (user_from_cache) {
        console.log('user/leagues from cache...');
        console.log(req.body)
        const state = home_cache.get('state')
        const allplayers = allplayers_json;
        const schedule = schedule_json;
        const projections = projections_json;

        res.send({
            user: {
                ...user_from_cache,
                leagues: user_from_cache.leagues
            },
            state: state,
            allplayers: req.body.allplayers && JSON.stringify(allplayers),
            schedule: JSON.stringify(schedule),
            projections: req.body.projections && JSON.stringify(projections)
        })
    } else {
        // check if user exists in Sleeper.  Update info if exists, send error message if not.

        const user = await axios.get(`http://api.sleeper.app/v1/user/${req.body.username}`)

        if (user.data?.user_id) {
            const data = await User.upsert({
                user_id: user.data.user_id,
                username: user.data.display_name,
                avatar: user.data.avatar,
                type: 'S', // S = 'Searched'
                updatedAt: new Date()

            })

            req.userData = data[0].dataValues
            next()
        } else {
            res.send({ error: 'User not found' })
        }
    }
}
