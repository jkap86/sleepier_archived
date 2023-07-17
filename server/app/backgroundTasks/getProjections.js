module.exports = async (home_cache) => {
    const axios = require('../api/axiosInstance');

    const getProjections = async (season, week) => {
        const getPlayerScore = (stats_array, scoring_settings, total = false) => {

            let total_breakdown = {};

            stats_array?.map(stats_game => {
                Object.keys(stats_game?.stats || {})
                    .filter(x => Object.keys(scoring_settings).includes(x))
                    .map(key => {
                        if (!total_breakdown[key]) {
                            total_breakdown[key] = {
                                stats: 0,
                                points: 0
                            }
                        }
                        total_breakdown[key] = {
                            stats: total_breakdown[key].stats + stats_game.stats[key],
                            points: total_breakdown[key].points + (stats_game.stats[key] * scoring_settings[key])
                        }
                    })
            })

            return total
                ? Object.keys(total_breakdown).reduce((acc, cur) => acc + total_breakdown[cur].points, 0)
                : total_breakdown;
        }

        const projections = await axios.get(`https://api.sleeper.com/projections/nfl/${season}/${week}?season_type=regular&position[]=QB&position[]=RB&position[]=TE&position[]=WR&order_by=ppr`)

        const ppr_scoring_settings = {
            'pass_yd': 0.04,
            'pass_td': 4,
            'pass_2pt': 2,
            'pass_int': -1,
            'rush_yd': 0.1,
            'rush_2pt': 2,
            'rush_td': 6,
            'rec': 1,
            'rec_yd': 0.1,
            'rec_2pt': 2,
            'rec_td': 6,
            'fum_lost': -2
        }

        const projections_totals = projections.data
            .filter(p => p.stats.pts_ppr)
            .map(p => {
                const ppr_score = getPlayerScore([p], ppr_scoring_settings, true)
                return {
                    ...p,
                    stats: {
                        ...p.stats,
                        pts_ppr: ppr_score
                    }
                }
            })

        home_cache.set('projections', projections_totals, 0)
    }

    setTimeout(() => {
        const state = home_cache.get('state')
        if (state.display_week > 0 && state.display_week < 19) {
            getProjections(state.league_season, state.display_week)
        }
    }, 5000)

    setInterval(() => {
        const state = home_cache.get('state')
        if (state.display_week > 0 && state.display_week < 19) {
            getProjections(state.league_season, state.display_week)
        }
    }, 15 * 60 * 1000)
}