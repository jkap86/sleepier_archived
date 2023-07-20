'use strict'
const db = require("../models");
const projections_json = require('../../projections.json');

exports.fetch = async (req, res, home_cache) => {
    const stateAllPlayers = home_cache.get('allplayers')
    const stateNflSchedule = home_cache.get('schedule')
    const projections = projections_json

    const getProjectedRecordDict = (leagues, week, includeTaxi, includeLocked) => {

        let projectedRecordDict = {};

        (user?.leagues || [])
            .forEach(league => {
                projectedRecordDict[league.league_id] = {};
                const matchups = league[`matchups_${week}`]

                league.rosters
                    .forEach(roster => {
                        const matchup = matchups?.find(m => m.roster_id === roster.roster_id)
                        const opponentMatchup = matchups?.find(m => m.matchup_id === matchup.matchup_id && m.roster_id !== matchup.roster_id)

                        const userLineup = matchup && getLineupCheck(matchup, league, stateAllPlayers, rankings, projections[week], stateNflSchedule[week], includeTaxi, includeLocked)
                        const oppLineup = opponentMatchup && getLineupCheck(opponentMatchup, league, stateAllPlayers, rankings, projections[week], stateNflSchedule[week], includeTaxi, includeLocked)

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
                            },
                            /*
                                                user_starters_actual: user_starters_actual,
                                                opp_starters_actual: opp_starters_actual,
                                                user_starters_proj: user_starters_proj,
                                                opp_starters_proj: opp_starters_proj,
                                                user_optimal_actual: user_optimal_actual,
                                                opp_optimal_actual: opp_optimal_actual,
                                                user_optimal_proj: user_optimal_proj,
                                                opp_optimal_proj: opp_optimal_proj,
                                                wins: {
                                                    starters_proj: user_starters_proj > opp_starters_proj ? 1 : 0,
                                                    optimal_proj: user_optimal_proj > opp_optimal_proj ? 1 : 0,
                                                    starters_optimal_proj: user_starters_proj > opp_optimal_proj ? 1 : 0,
                                                    optimal_starters_proj: user_optimal_proj > opp_starters_proj ? 1 : 0,
                                                    starters_actual: user_starters_actual > opp_starters_actual ? 1 : 0,
                                                    optimal_actual: user_optimal_actual > opp_optimal_actual ? 1 : 0,
                                                    starters_optimal_actual: user_starters_actual > opp_optimal_actual ? 1 : 0,
                                                    optimal_starters_actual: user_optimal_actual > opp_starters_actual ? 1 : 0
                                                },
                                                losses: {
                                                    starters_proj: user_starters_proj < opp_starters_proj ? 1 : 0,
                                                    optimal_proj: user_optimal_proj < opp_optimal_proj ? 1 : 0,
                                                    starters_optimal_proj: user_starters_proj < opp_optimal_proj ? 1 : 0,
                                                    optimal_starters_proj: user_optimal_proj < opp_starters_proj ? 1 : 0,
                                                    starters_actual: user_starters_actual < opp_starters_actual ? 1 : 0,
                                                    optimal_actual: user_optimal_actual < opp_optimal_actual ? 1 : 0,
                                                    starters_optimal_actual: user_starters_actual < opp_optimal_actual ? 1 : 0,
                                                    optimal_starters_actual: user_optimal_actual < opp_starters_actual ? 1 : 0
                                                },
                                                ties: {
                                                    starters_proj: (user_starters_proj + opp_starters_proj > 0 && user_starters_proj === opp_starters_proj) ? 1 : 0,
                                                    optimal_proj: (user_optimal_proj + opp_optimal_proj > 0 && user_optimal_proj === opp_optimal_proj) ? 1 : 0,
                                                    starters_optimal_proj: (user_starters_proj + opp_optimal_proj > 0 && user_starters_proj === opp_optimal_proj) ? 1 : 0,
                                                    optimal_starters_proj: (user_optimal_proj + opp_starters_proj > 0 && user_optimal_proj === opp_starters_proj) ? 1 : 0,
                                                    starters_actual: (user_starters_actual + opp_starters_actual > 0 && user_starters_actual === opp_starters_actual) ? 1 : 0,
                                                    optimal_actual: (user_optimal_actual + opp_optimal_actual > 0 && user_optimal_actual === opp_optimal_actual) ? 1 : 0,
                                                    starters_optimal_actual: (user_starters_actual + opp_optimal_actual > 0 && user_starters_actual === opp_optimal_actual) ? 1 : 0,
                                                    optimal_starters_actual: (user_optimal_actual + opp_starters_actual > 0 && user_optimal_actual === opp_starters_actual) ? 1 : 0
                                                }
                            */
                        }
                    })
            })





        return projectedRecordDict

    }


}

