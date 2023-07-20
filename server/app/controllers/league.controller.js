'use strict';
const db = require("../models");
const League = db.leagues;
const User = db.users;
const axios = require('../api/axiosInstance');
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const NodeCache = require('node-cache');
const cache = new NodeCache()
const projections_json = require('../../projections.json');
const workerpool = require('workerpool');
const pool = workerpool.pool(__filename);

const getProjectedRecordDict = (leagues, week, user_id, includeTaxi, includeLocked, stateAllPlayers, stateNflSchedule, projections) => {
    let projectedRecordDict = {}

    leagues
        .forEach(league => {
            projectedRecordDict[league.league_id] = {};
            const matchups = league[`matchups_${week}`]

            league.rosters
                .forEach(roster => {
                    const userRoster = league.rosters
                        ?.find(r => r.user_id === user_id || r.co_owners?.find(co => co?.user_id === user_id))


                    const matchup = matchups?.find(m => m.roster_id === roster.roster_id)
                    const opponentMatchup = matchups?.find(m => m.matchup_id === matchup.matchup_id && m.roster_id !== matchup.roster_id)

                    const userLineup = matchup && getLineupCheck(matchup, league, stateAllPlayers, null, projections[week], stateNflSchedule[week], includeTaxi, includeLocked, matchup.roster_id === userRoster.roster_id)
                    const oppLineup = opponentMatchup && getLineupCheck(opponentMatchup, league, stateAllPlayers, null, projections[week], stateNflSchedule[week], includeTaxi, includeLocked, matchup.roster_id === userRoster.roster_id)

                    const user_starters_actual = matchup?.starters?.reduce((acc, cur) => acc + (matchup.players_points[cur] || 0), 0)
                    const opp_starters_actual = opponentMatchup?.starters?.reduce((acc, cur) => acc + (opponentMatchup.players_points[cur] || 0), 0)

                    const user_starters_proj = matchup?.starters?.reduce((acc, cur) => acc + (userLineup.players_projections[cur] || 0), 0)
                    const opp_starters_proj = opponentMatchup?.starters?.reduce((acc, cur) => acc + (oppLineup.players_projections[cur] || 0), 0)

                    const user_optimal_actual = userLineup?.optimal_lineup?.reduce((acc, cur) => acc + matchup.players_points[cur.player], 0)
                    const opp_optimal_actual = oppLineup?.optimal_lineup?.reduce((acc, cur) => acc + opponentMatchup.players_points[cur.player], 0)

                    const user_optimal_proj = userLineup?.optimal_lineup?.reduce((acc, cur) => acc + (userLineup.players_projections[cur.player] || 0), 0)
                    const opp_optimal_proj = oppLineup?.optimal_lineup?.reduce((acc, cur) => acc + oppLineup.players_projections[cur.player], 0)

                    projectedRecordDict[league.league_id][roster.roster_id] = {
                        userLineup: userLineup,
                        oppLineup: oppLineup,
                        starters_proj: {
                            wins: user_starters_proj > opp_starters_proj ? 1 : 0,
                            losses: user_starters_proj < opp_starters_proj ? 1 : 0,
                            ties: (user_starters_proj + opp_starters_proj > 0 && user_starters_proj === opp_starters_proj) ? 1 : 0,
                            fpts: user_starters_proj || 0,
                            fpts_against: opp_starters_proj || 0
                        },
                        optimal_proj: {
                            wins: user_optimal_proj > opp_optimal_proj ? 1 : 0,
                            losses: user_optimal_proj < opp_optimal_proj ? 1 : 0,
                            ties: (user_optimal_proj + opp_optimal_proj > 0 && user_optimal_proj === opp_optimal_proj) ? 1 : 0,
                            fpts: user_optimal_proj || 0,
                            fpts_against: opp_optimal_proj || 0
                        },
                        starters_optimal_proj: {
                            wins: user_starters_proj > opp_optimal_proj ? 1 : 0,
                            losses: user_starters_proj < opp_optimal_proj ? 1 : 0,
                            ties: (user_starters_proj + opp_optimal_proj > 0 && user_starters_proj === opp_optimal_proj) ? 1 : 0,
                            fpts: user_starters_proj,
                            fpts_against: opp_optimal_proj
                        },
                        optimal_starters_proj: {
                            wins: user_optimal_proj > opp_starters_proj ? 1 : 0,
                            losses: user_optimal_proj < opp_optimal_proj ? 1 : 0,
                            ties: (user_optimal_proj + opp_starters_proj > 0 && user_optimal_proj === opp_starters_proj) ? 1 : 0,
                            fpts: user_optimal_proj,
                            fpts_against: opp_starters_proj
                        }
                    }
                })
        })


    return projectedRecordDict
}

workerpool.worker({
    getProjectedRecordDict: getProjectedRecordDict
})

function splitIntoChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

exports.matchups = async (req, res, home_cache) => {
    const stateAllPlayers = home_cache.get('allplayers')
    const stateNflSchedule = home_cache.get('schedule')
    const projections = projections_json

    let league_matchups_db;

    try {
        league_matchups_db = await League.findAll({
            where: {
                league_id: Object.keys(req.body.leagues_dict)
            },
            attributes: ['league_id', 'rosters', 'scoring_settings', 'roster_positions', ...Array.from(Array(18).keys()).map(key => `matchups_${key + 1}`)],
            raw: true
        })
    } catch (error) {
        console.log(error.message)
    }

    const league_matchups_up_to_date = league_matchups_db
        .filter(
            league =>
                !Object.keys(league)
                    .find(
                        key =>
                            !league[key]
                            && key.startsWith('matchups_')
                            && parseInt(key.split('_')[1]) < req.body.leagues_dict[league.league_id]
                    )
        )

    const league_matchups_updated = [...league_matchups_up_to_date];

    let update_count = 0

    league_matchups_db
        .filter(league => !league_matchups_up_to_date.map(league2 => league2.league_id).includes(league.league_id))
        .forEach(async league => {
            const matchups_up_to_date = Object.fromEntries(Object.keys(league)
                .filter(key => league[key] && key.startsWith('matchups_') && parseInt(key.split('_')[1]) < req.body.leagues_dict[league.league_id])
                .map(key => [key, league[key]]))

            const matchups_updated = {};

            try {
                await Promise.all(Object.keys(league)
                    .filter(key => !matchups_up_to_date[key] && parseInt(key.split('_')[1]))
                    .map(async key => {
                        const week = parseInt(key.split('_')[1])
                        const updated_matchups_league_week = await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`)
                        matchups_updated[key] = updated_matchups_league_week.data
                    }))
            } catch (error) {
                console.log(error.message)
            }

            try {
                const [updated] = await League.update(matchups_updated, {
                    where: {
                        league_id: league.league_id
                    }
                })
                update_count += updated
            } catch (error) {
                console.log(error.message)
            }

            league_matchups_updated.push({
                ...league,
                ...matchups_updated
            })
        })


    console.log(`matchups updated for ${update_count} leagues...`)

    const chunkSize = 25;

    const chunks = splitIntoChunks(league_matchups_updated, chunkSize);

    let promises;

    try {
        promises = chunks.map((chunk) => pool.exec('getProjectedRecordDict', [chunk, req.body.week, req.body.user_id, true, true, stateAllPlayers, stateNflSchedule, projections]));
    }
    catch (error) {
        console.log(error)
    }
    const chunkResults = await Promise.all(promises);

    console.log({ chunkResults: chunkResults.length })

    console.log('Sending Projections Dict')

    res.send({ [req.body.week]: Object.assign({}, ...chunkResults) })
    pool.terminate()
}

exports.find = async (req, res, home_cache, cache) => {
    const user_id = req.userData.user_id

    const state = home_cache.get('state')
    const allplayers = home_cache.get('allplayers')
    const schedule = home_cache.get('schedule')
    const projections = projections_json



    // get current user leagues and convert to array of league_ids

    let leagues = await axios.get(`https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/${state.league_season}`)

    const league_ids = []
    leagues.data.map((league, index) => {
        return league_ids[index] = league.league_id
    })

    try {
        const deleted = await sequelize.model('userLeagues').destroy({
            where: {
                [Op.and]: [
                    {
                        userUserId: user_id
                    },
                    {
                        leagueLeagueId: {
                            [Op.not]: league_ids
                        }
                    }
                ]
            }
        })

        if (deleted > 0) {
            console.log(`${deleted} associations deleted for user ${user_id}`)
        }

    } catch (error) {
        console.log(error)
    }

    const [leagues_to_add, leagues_to_update, leagues_up_to_date] = await getLeaguesToUpsert(user_id, league_ids)

    //  get updated data for leagues_to_add and leagues_to_update

    const new_leagues = await getBatchLeaguesDetails(leagues_to_add, state.display_week, true)
    const updated_leagues = await getBatchLeaguesDetails(leagues_to_update, state.display_week, false)

    const all_leagues = [...new_leagues, ...updated_leagues]



    try {
        const keys = ["name", "avatar", "settings", "scoring_settings", "roster_positions",
            "rosters", "drafts", "updatedAt"]

        let keys_update = [];
        let keys_new = [];

        if (state.display_week >= 0 && state.display_week < 19) {
            keys_update.push(`matchups_${Math.max(1, state.display_week)}`)
            keys_new.push(...Array.from(Array(18).keys()).map(key => `matchups_${key + 1}`))
        }

        await League.bulkCreate(new_leagues, {
            updateOnDuplicate: keys_new
        })

        await League.bulkCreate(updated_leagues, {
            updateOnDuplicate: keys_update
        })

    } catch (error) {
        console.log(error)
    }

    //  get other users from each league and create associations

    const user_data = []
    const user_league_data = []



    all_leagues
        .filter(result => result !== undefined)
        .forEach(league => {

            league.users.forEach(user => {
                user_data.push({
                    user_id: user.user_id,
                    username: user.display_name,
                    avatar: user.avatar,
                    type: 'LM',
                    updatedAt: new Date()
                })

                user_league_data.push({
                    userUserId: user.user_id,
                    leagueLeagueId: league.league_id
                })
            })
        })



    try {
        await User.bulkCreate(user_data, { ignoreDuplicates: true })

        await sequelize.model('userLeagues').bulkCreate(user_league_data, { ignoreDuplicates: true })


    } catch (error) {
        console.log(error)
    }

    const leagues_to_send = [...new_leagues, ...updated_leagues, ...leagues_up_to_date]
        .filter(league => league !== undefined && league.rosters.find(roster => roster?.players?.length > 0))
        .sort((a, b) => league_ids.indexOf(a.league_id) - league_ids.indexOf(b.league_id))


    try {
        if (!(leagues_to_send.filter(result => result === undefined)?.length > 0)) {
            cache.set(req.userData.username.toLowerCase(), {
                ...req.userData,
                leagues: JSON.stringify(leagues_to_send)
            }, 15 * 60)
        }
    } catch (error) {
        console.log(error)
    }
    res.send({
        user: {
            ...req.userData,
            leagues: leagues_to_send
        },
        state: state,
        allplayers: allplayers,
        schedule: schedule,
        projections: projections
    })
}


const getLeaguesToUpsert = async (user_id, league_ids) => {

    // find existing user leagues in db

    let user;

    try {
        user = await User.findByPk(user_id, {
            include: {
                model: League
            }
        })
    } catch (error) {
        console.log(error)
    }

    let leagues_user_db = user.leagues

    //  split leagues into - leagues_to_add: not in db; leagues_to_update: in db but not updated in last 24hrs; 
    //  leagues_up_to_date: in db and updated within 24 hrs

    const cutoff = new Date(new Date() - (24 * 60 * 60 * 1000))

    const leagues_to_add = league_ids
        .filter(l =>
            !leagues_user_db?.find(l_db => l_db.league_id === l)
        )

    const leagues_to_update = league_ids
        .filter(l =>
            leagues_user_db?.find(l_db => l_db.league_id === l)
            && leagues_user_db?.find(l_db => l_db.league_id === l).updatedAt < cutoff
        )

    const leagues_up_to_date = leagues_user_db
        .filter(l_db =>
            l_db.updatedAt >= cutoff
        )



    return [leagues_to_add, leagues_to_update, leagues_up_to_date]
}

const getBatchLeaguesDetails = async (leagueIds, display_week, new_league, sync) => {
    const getLeagueDetails = async (league_id, display_week, new_league, sync) => {
        const getDraftPicks = (traded_picks, rosters, users, drafts, league) => {
            let draft_season;
            if (drafts.find(x => x.status !== 'complete' && x.settings.rounds === league.settings.draft_rounds)) {
                draft_season = parseInt(league.season)
            } else {
                draft_season = parseInt(league.season) + 1
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

        try {
            const league = await axios.get(`https://api.sleeper.app/v1/league/${league_id}`)
            const users = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/users`)
            const rosters = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/rosters`)
            const drafts = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/drafts`)
            const traded_picks = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/traded_picks`)



            //  update current week matchup for existing leagues, get all season matchups through current weekk for new leagues

            let matchups = {};
            if (sync) {
                try {
                    await Promise.all(Array.from(Array(18).keys())
                        .map(async week => {
                            const matchup_prev = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/matchups/${week + 1}`)

                            matchups[`matchups_${week + 1}`] = matchup_prev.data

                        }))

                } catch (error) {
                    console.log(error)
                }
            } else if (league.data.status === 'in_season') {
                try {
                    const matchup_week = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/matchups/${Math.max(display_week, 1)}`)
                    matchups[`matchups_${Math.max(display_week, 1)}`] = matchup_week.data

                    if (new_league) {


                        await Promise.all(Array.from(Array(Math.max(display_week, 1)).keys())
                            .filter(key => key + 1 !== Math.max(display_week, 1))
                            .map(async week => {
                                const matchup_prev = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/matchups/${week + 1}`)

                                matchups[`matchups_${week + 1}`] = matchup_prev.data

                            }))
                    }
                } catch (error) {
                    console.log(error)
                }
            }



            const draft_picks = (
                league.data.status === 'in_season'
                && league.data.settings.type === 2
            )
                && getDraftPicks(traded_picks.data, rosters.data, users.data, drafts.data, league.data)
                || []

            const drafts_array = []

            for (const draft of drafts.data) {
                drafts_array.push({
                    draft_id: draft.draft_id,
                    status: draft.status,
                    rounds: draft.settings.rounds,
                    draft_order: draft.draft_order
                })
            }


            const rosters_username = [...rosters.data]
                ?.sort(
                    (a, b) =>
                        (b.settings?.wins ?? 0) - (a.settings?.wins ?? 0)
                        || (b.settings?.fpts ?? 0) - (a.settings?.fpts ?? 0)
                );

            for (const [index, roster] of rosters_username.entries()) {
                const user = users.data.find(u => u.user_id === roster.owner_id);
                const co_owners = roster.co_owners?.map(co => {
                    const co_user = users.data.find(u => u.user_id === co);
                    return {
                        user_id: co_user?.user_id,
                        username: co_user?.display_name,
                        avatar: co_user?.avatar
                    };
                });
                rosters_username[index] = {
                    rank: index + 1,
                    taxi: roster.taxi,
                    starters: roster.starters,
                    settings: roster.settings,
                    roster_id: roster.roster_id,
                    reserve: roster.reserve,
                    players: roster.players,
                    user_id: roster.owner_id,
                    username: user?.display_name,
                    avatar: user?.avatar,
                    co_owners,
                    draft_picks: draft_picks[roster.roster_id]
                };
            }

            const {
                type,
                best_ball,
                trade_deadline,
                waiver_day_of_week,
                daily_waivers_hour,
                league_average_match,
                playoff_week_start
            } = league.data.settings || {}

            const settings = {
                type,
                best_ball,
                trade_deadline,
                waiver_day_of_week,
                daily_waivers_hour,
                league_average_match,
                playoff_week_start,
                status: league.data.status
            }

            const users_w_rosters = users.data
                ?.filter(user =>
                    rosters.data
                        ?.find(roster =>
                            roster.owner_id === user.user_id
                            || roster.co_owners?.find(co => co === user.user_id)
                        )
                )



            return {
                league_id: league_id,
                name: league.data.name,
                avatar: league.data.avatar,
                season: league.data.season,
                settings: settings,
                scoring_settings: league.data.scoring_settings,
                roster_positions: league.data.roster_positions,
                rosters: rosters_username,
                drafts: drafts_array,
                ...matchups,
                updatedAt: Date.now(),
                users: users_w_rosters
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    //  update in chunks of 50 leagues at a time

    const allResults = [];

    const chunkSize = 50;

    for (let i = 0; i < leagueIds.length; i += chunkSize) {
        const chunk = leagueIds.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(async (leagueId) => {
            const result = await getLeagueDetails(leagueId, display_week, new_league, sync);
            return result !== null ? result : undefined;
        }));
        allResults.push(...chunkResults);
    }

    const results = await Promise.all(allResults)

    return results;
}



exports.sync = async (req, res, home_cache, user_cache) => {

    const state = home_cache.get('state')

    const updated_league = await getBatchLeaguesDetails([req.body.league_id], state.display_week, false, true)

    await League.update({
        ...updated_league[0]
    }, {
        where: {
            league_id: updated_league[0]?.league_id
        }
    })

    let user_from_cache;
    try {
        user_from_cache = user_cache.get(req.body.username.toLowerCase())
    } catch (error) {
        console.log(error)
    }

    if (user_from_cache) {

        const updated_leagues = JSON.parse(user_from_cache.leagues).map(league => {
            if (league.league_id === updated_league[0]?.league_id) {
                return updated_league[0]
            } else {
                return league
            }
        })

        try {
            user_cache.set(
                req.body.username.toLowerCase(),
                {
                    ...user_from_cache,
                    leagues: JSON.stringify(updated_leagues)
                },
                cache.ttl(req.body.username.toLowerCase()))
        } catch (error) {
            console.log(error)
        }
    }
    res.send(updated_league[0])
}

exports.picktracker = async (req, res, home_cache) => {
    let active_draft;
    let league;
    let league_drafts;
    try {
        league = await axios.get(`https://api.sleeper.app/v1/league/${req.body.league_id}`)
        league_drafts = await axios.get(`https://api.sleeper.app/v1/league/${req.body.league_id}/drafts`)
        active_draft = league_drafts.data?.find(d => d.settings.slots_k > 0 && d.settings.rounds > league.data.settings.draft_rounds)
    } catch (error) {
        console.log(error.message)
    }


    if (active_draft) {
        const allplayers = home_cache.get('allplayers')
        const draft_picks = await axios.get(`https://api.sleeper.app/v1/draft/${active_draft.draft_id}/picks`)
        const users = await axios.get(`https://api.sleeper.app/v1/league/${req.body.league_id}/users`)
        const teams = Object.keys(active_draft.draft_order).length

        const picktracker = draft_picks.data.filter(pick => pick.metadata.position === "K").map((pick, index) => {
            return {
                pick: Math.floor(index / teams) + 1 + "." + ((index % teams) + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 }),
                player: allplayers[pick.player_id]?.full_name,
                player_id: pick.player_id,
                picked_by: users.data.find(u => u.user_id === pick.picked_by)?.display_name,
                picked_by_avatar: users.data.find(u => u.user_id === pick.picked_by)?.avatar
            }
        })

        res.send({
            league: league.data,
            picks: picktracker
        })

    } else {
        res.send([])
    }
}



const getLineupCheck = (matchup, league, stateAllPlayers, weeklyRankings, projections, schedule, includeTaxi, includeLocked, getSubs) => {

    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
    }
    const position_abbrev = {
        'QB': 'QB',
        'RB': 'RB',
        'WR': 'WR',
        'TE': 'TE',
        'SUPER_FLEX': 'SF',
        'FLEX': 'WRT',
        'WRRB_FLEX': 'W R',
        'WRRB_WRT': 'W R',
        'REC_FLEX': 'W T'
    }
    const starting_slots = league.roster_positions.filter(x => Object.keys(position_map).includes(x))

    const roster = league.rosters.find(r => r.roster_id === matchup.roster_id)

    let players = []

    matchup?.players
        ?.filter(player_id => includeTaxi ? true : !(roster?.taxi || []).includes(player_id))
        ?.map(player_id => {
            const playing = schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[player_id]?.team) || !stateAllPlayers[player_id]?.team)
            players.push({
                id: player_id,
                rank: weeklyRankings
                    ? !playing
                        ? 1001
                        : weeklyRankings[player_id]?.prevRank
                            ? matchup.starters?.includes(player_id)
                                ? weeklyRankings[player_id]?.prevRank
                                : weeklyRankings[player_id]?.prevRank + 1
                            : matchup.starters?.includes(player_id)
                                ? 999
                                : 1000
                    : getPlayerScore([projections[player_id]], league.scoring_settings, true) || 0
            })
        })

    const getOptimalLineup = () => {
        let optimal_lineup = []
        let player_ranks_filtered = players
        starting_slots.map((slot, index) => {
            const kickoff = new Date(parseInt(schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === (stateAllPlayers[matchup.starters?.[index]]?.team)))
                ?.kickoff * 1000)).getTime()

            const slot_options = player_ranks_filtered
                .filter(x =>
                    position_map[slot].includes(stateAllPlayers[x.id]?.position)
                )
                .sort(
                    (a, b) => weeklyRankings ? a.rank - b.rank : b.rank - a.rank
                )

            const optimal_player = includeLocked && kickoff > new Date().getTime() ? matchup.starters[index] : slot_options[0]?.id

            player_ranks_filtered = player_ranks_filtered.filter(x => x.id !== optimal_player)
            optimal_lineup.push({
                slot: position_abbrev[slot],
                player: optimal_player
            })
        })

        return optimal_lineup
    }

    let optimal_lineup = matchup ? getOptimalLineup() : []

    const findSuboptimal = () => {
        let lineup_check = []
        starting_slots.map((slot, index) => {
            const cur_id = (matchup?.starters || [])[index]
            const isInOptimal = optimal_lineup.find(x => x.player === cur_id)
            const kickoff = new Date(parseInt(schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[cur_id]?.team))
                ?.kickoff * 1000))
            const gametime = new Date(kickoff)
            const day = gametime.getDay() <= 2 ? gametime.getDay() + 7 : gametime.getDay()
            const hour = gametime.getHours()
            const timeslot = parseFloat(day + '.' + hour)
            const slot_options = matchup?.players
                ?.filter(x =>
                    !(matchup.starters || []).includes(x) &&
                    position_map[slot].includes(stateAllPlayers[x]?.position)
                )
                || []
            const earlyInFlex = matchup.starters?.find((x, starter_index) => {
                const alt_kickoff = new Date(parseInt(schedule
                    ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[x]?.team))
                    ?.kickoff * 1000))
                const alt_gametime = new Date(alt_kickoff)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return timeslot < 7
                    && alt_timeslot > timeslot

                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length < position_map[slot].length


            })

            const lateNotInFlex = matchup.starters?.find((x, starter_index) => {
                const alt_kickoff = new Date(parseInt(schedule
                    ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[x]?.team))
                    ?.kickoff * 1000))
                const alt_gametime = new Date(alt_kickoff)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return (
                    timeslot > 7.17
                    && alt_timeslot < timeslot

                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length > position_map[slot].length

                )
            })

            return lineup_check.push({
                index: index,
                slot: position_abbrev[slot] || 'IDP',
                slot_index: `${position_abbrev[slot]}_${index}`,
                current_player: (matchup?.starters || [])[index] || '0',
                notInOptimal: !isInOptimal,
                earlyInFlex: earlyInFlex,
                lateNotInFlex: lateNotInFlex,
                nonQBinSF: position_map[slot].includes('QB') && stateAllPlayers[(matchup?.starters || [])[index]]?.position !== 'QB',
                slot_options: slot_options,
                player: stateAllPlayers[matchup?.starters[index]]?.full_name,
                timeslot: timeslot

            })
        })
        return lineup_check
    }

    const lineup_check = matchup ? findSuboptimal() : []

    return {
        players_points: matchup.players_points,
        players_projections: Object.fromEntries(players.map(player => [player.id, parseFloat(player.rank)])),
        starting_slots: starting_slots,
        optimal_lineup: optimal_lineup,
        lineup_check: lineup_check
    }
}
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

const matchTeam = (team) => {
    const team_abbrev = {
        SFO: 'SF',
        JAC: 'JAX',
        KCC: 'KC',
        TBB: 'TB',
        GBP: 'GB',
        NEP: 'NE',
        LVR: 'LV',
        NOS: 'NO'
    }
    return team_abbrev[team] || team
}

