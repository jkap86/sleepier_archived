import { useParams, Link } from "react-router-dom";
import React, { useEffect, useCallback, useMemo } from "react";
import { loadingIcon } from "./functions/misc";
import { useDispatch, useSelector } from "react-redux";
import { resetState, fetchUser, fetchFilteredData, fetchLmTrades, fetchProjections, setState } from "../../actions/actions";
import Heading from "./heading";
import '../css/main.css';
import Players from "../Players/players";
import Trades from '../Trades/trades';
import Leagues from "../Leagues/leagues";
import Leaguemates from "../Leaguemates/leaguemates";
import Lineups from "../Lineups/lineups";
import { getLineupCheck } from "./functions/getLineupCheck";

const Main = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const { isLoadingUser, errorUser, user } = useSelector((state) => state.user);
    const { tab, state, projections, allPlayers: stateAllPlayers, nflSchedule: stateNflSchedule, projectionDict } = useSelector(state => state.main);
    const { rankings, includeTaxi, includeLocked, week } = useSelector(state => state.lineups)
    const { isLoadingData } = useSelector(state => state.filteredData);

    console.log({ projections: projections })
    useEffect(() => {
        if (params.username !== user.username) {
            dispatch(resetState());
            dispatch(fetchUser(params.username));
        }
    }, [params.username])

    const handleFetchFilteredData = useCallback((tab) => {
        dispatch(fetchFilteredData(user.leagues, tab, state.league_season));
    }, [dispatch, user, state])

    useEffect(() => {
        if (user.user_id) {
            handleFetchFilteredData(tab)
        }
    }, [user, tab, handleFetchFilteredData])



    useEffect(() => {
        if (user.user_id) {
            dispatch(fetchLmTrades(user.user_id, user.leagues, state.league_season, 0, 125))
        }
    }, [user, dispatch])


    const projectedRecordDict = useMemo(() => {
        if (projectionDict[week]) {
            return projectionDict[week]
        } else {
            let projectedRecordWeek = {};

            (user?.leagues || [])
                .forEach(league => {
                    projectedRecordWeek[league.league_id] = {};
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

                            projectedRecordWeek[league.league_id][roster.roster_id] = {
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

                            }
                        })
                })

            dispatch(
                setState({
                    projectionDict: {
                        ...projectionDict,
                        [week]: projectedRecordWeek
                    }
                }, 'MAIN')
            )
            return projectedRecordWeek
        }



    }, [
        user,
        projections,
        stateAllPlayers,
        stateNflSchedule,
        rankings,
        includeTaxi,
        includeLocked,
        week
    ])


    let display;

    switch (tab) {
        case 'players':
            display = !isLoadingData && <Players /> || loadingIcon
            break;
        case 'trades':
            display = <Trades />
            break;
        case 'leagues':
            display = !isLoadingData && <Leagues /> || loadingIcon
            break;
        case 'leaguemates':
            display = !isLoadingData && <Leaguemates /> || loadingIcon
            break;
        case 'lineups':
            display = !isLoadingData && <Lineups projectedRecordDict={projectedRecordDict} /> || loadingIcon
            break;
        default:
            break;
    }


    return <>
        {
            isLoadingUser ? loadingIcon
                : errorUser
                    ? <h1>{errorUser.error}</h1>
                    :
                    <>
                        <Link to="/" className="home">
                            Home
                        </Link>
                        <Heading />
                        {display}
                    </>
        }
    </>
}

export default Main;