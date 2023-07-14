'use strict'
const axios = require('../api/axiosInstance');
const NodeCache = require('node-cache');

const cache = new NodeCache()


exports.home = (req, res, home_cache) => {
    const state = home_cache.get('state')
    const allplayers = home_cache.get('allplayers')

    res.send({
        state: state,
        allplayers: allplayers
    })
}

exports.standings = async (req, res) => {
    const getDraftPicks = (traded_picks, rosters, users, drafts, league) => {
        let draft_season;
        if (drafts.find(x => x.status === 'complete' && x.settings.rounds === league.settings.draft_rounds)) {
            draft_season = parseInt(league.season) + 1
        } else {
            draft_season = parseInt(league.season)
        }

        const draft_order = drafts.find(x => x.status !== 'complete' && x.settings.rounds === league.settings.draft_rounds)?.draft_order

        let original_picks = {}

        for (let i = 0; i < rosters.length; i++) {
            original_picks[rosters[i].roster_id] = []

            for (let j = parseInt(draft_season); j <= parseInt(draft_season) + 2; j++) {

                for (let k = 1; k <= league.settings.draft_rounds; k++) {
                    const original_user = users.find(u => u.user_id === rosters[i].owner_id)

                    if (!traded_picks.find(pick => parseInt(pick.season) === j && pick.round === k && pick.roster_id === rosters[i].roster_id)) {
                        original_picks[rosters[i].roster_id].push({
                            season: j,
                            round: k,
                            roster_id: rosters[i].roster_id,
                            original_user: {
                                avatar: original_user?.avatar || null,
                                user_id: original_user?.user_id || '0',
                                username: original_user?.display_name || 'Orphan'
                            },
                            order: draft_order && draft_order[original_user?.user_id]
                        })
                    }
                }
            }

            traded_picks.filter(x => x.owner_id === rosters[i].roster_id && parseInt(x.season) >= draft_season)
                .map(pick => {
                    const original_user = users.find(u => rosters.find(r => r.roster_id === pick.roster_id)?.owner_id === u.user_id)
                    return original_picks[rosters[i].roster_id].push({
                        season: parseInt(pick.season),
                        round: pick.round,
                        roster_id: pick.roster_id,
                        original_user: {
                            avatar: original_user?.avatar || null,
                            user_id: original_user?.user_id || '0',
                            username: original_user?.display_name || 'Orphan'
                        },
                        order: draft_order && draft_order[original_user?.user_id]
                    })
                })

            traded_picks.filter(x => x.previous_owner_id === rosters[i].roster_id)
                .map(pick => {
                    const index = original_picks[rosters[i].roster_id].findIndex(obj => {
                        return obj.season === pick.season && obj.round === pick.round && obj.roster_id === pick.roster_id
                    })

                    if (index !== -1) {
                        original_picks[rosters[i].roster_id].splice(index, 1)
                    }
                })
        }



        return original_picks
    }

    const getStandingsROF = async (season) => {
        console.log(`Getting ROF standings for ${season}...`)

        const leagues = await axios.get(`https://api.sleeper.app/v1/user/435483482039250944/leagues/nfl/${season}`)
        let leaguesROF = leagues.data.filter(x => x.name.includes('Ring of Fire: '))

        console.log({
            season: season
        })
        let rostersROF = []

        await Promise.all(leaguesROF.map(async league => {
            const [rosters, users, traded_picks_current, drafts] = await Promise.all([
                await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`),
                await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/users`),
                await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/traded_picks`),
                await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/drafts`)
            ])
            let draft_picks = getDraftPicks(traded_picks_current.data, rosters.data, users.data, drafts.data, league)
            rosters.data.map(roster => {
                rostersROF.push({
                    ...roster,
                    ...league,
                    rosters: rosters.data.map(r => {
                        const user = users.data.find(x => x.user_id === r.owner_id)
                        return {
                            ...r,
                            username: user?.display_name || 'Orphan',
                            avatar: user?.avatar || null,
                            user_id: r.owner_id,
                            draft_picks: draft_picks[r.roster_id]
                        }
                    }),
                    scoring_settings: league.scoring_settings,
                    draft_picks: draft_picks[roster.roster_id],
                    league_name: league.name,
                    league_avatar: league.avatar,
                    username: roster.owner_id > 0 ? users.data.find(x => x.user_id === roster.owner_id).display_name : 'orphan',
                    user_avatar: roster.owner_id > 0 ? users.data.find(x => x.user_id === roster.owner_id).avatar : null,
                    wins: roster.settings.wins,
                    losses: roster.settings.losses,
                    ties: roster.settings.ties,
                    fpts: parseFloat(roster.settings.fpts + '.' + roster.settings.fpts_decimal),
                    fpts_against: roster.settings.fpts_against === undefined ? 0 : parseFloat(roster.settings.fpts_against + '.' + roster.settings.fpts_against_decimal),

                })
            })
        }))

        console.log(`ROF standings update for ${season} complete...`)

        return rostersROF
    }

    const standings_cache = cache.get(`standingsROF_${req.body.season}`)

    if (standings_cache) {
        res.send(standings_cache)
    } else {
        const standings = await getStandingsROF(req.body.season)

        cache.set(`standingsROF_${req.body.season}`, standings, 6 * 60 * 60)
        res.send(standings)
    }
}