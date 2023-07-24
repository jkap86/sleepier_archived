'use strict'

const workerpool = require('workerpool');


module.exports = async (home_cache) => {
    const pool = workerpool.pool((__dirname + '/workerProjections.js'));

    if (process.env.DATABASE_URL) {
        setTimeout(async () => {
            const month = new Date().getMonth()
            const state = home_cache.get('state')
            if (month > 5) {
                try {
                    await pool.exec('getProjections', [state.league_season, state.display_week])
                } catch (error) {
                    console.log(error)
                }
            }
        }, 5000)

        setInterval(async () => {
            const month = new Date().getMonth();
            const state = home_cache.get('state')
            if (month > 5) {
                await pool.exec('getProjections', [state.league_season, state.display_week])
            }
        }, 15 * 60 * 1000)
    }
}