'use strict'
const db = require("../models");
const DynastyRankings = db.dynastyrankings;
const Op = db.Sequelize.Op;
const NodeCache = require('node-cache');
const cache = new NodeCache()

exports.find = async (req, res) => {
    const values_cache = cache.get(`${req.body.date1}_${req.body.date2}`)

    if (values_cache) {
        console.log('values from cache...')
        res.send(values_cache)
    } else {
        console.log('values from db...')
        const values = await DynastyRankings.findAll({
            where: {
                [Op.or]: [
                    {
                        date: req.body.date1
                    },
                    {
                        date: req.body.date2
                    }
                ]
            },

        })

        cache.set(`${req.body.date1}_${req.body.date2}`, values, 1800)

        res.send(values)
    }
}

exports.findrange = async (req, res) => {
    const values = await DynastyRankings.findAll({
        where: {
            date: req.body.dates
        }

    })

    res.send(values)
}

exports.stats = async (req, res) => {
    const stats_cache = cache.get(`stats_${req.body.date1}_${req.body.date2}`)

    if (stats_cache) {
        console.log('stats from cache...')
        res.send(stats_cache)
    } else {
        const stats = require('../../stats.json');

        const stats_data = {}

        stats
            .filter(s =>
                (new Date(s.date).getTime() + 1 * 24 * 60 * 60 * 1000) > new Date(req.body.date1).getTime()
                && (new Date(s.date).getTime() - 1 * 24 * 60 * 60 * 1000) < new Date(req.body.date2).getTime()
                && req.body.players?.includes(s.player_id)
                && s.stats.pts_ppr
            )
            .map(stats_object => {
                if (!stats_data[stats_object.player_id]) {
                    stats_data[stats_object.player_id] = []
                }

                stats_data[stats_object.player_id].push(stats_object)
            })

        cache.get(`stats_${req.body.date1}_${req.body.date2}`, stats_data, 1800)

        res.send(stats_data)
    }
}

