import { useParams, Link } from "react-router-dom";
import React, { useEffect, useCallback, useMemo } from "react";
import { loadingIcon } from "./functions/misc";
import { useDispatch, useSelector } from "react-redux";
import { resetState, fetchUser, fetchFilteredData, fetchLmTrades, syncLeague, setState } from "../../actions/actions";
import Heading from "./heading";
import '../css/main.css';
import Players from "../Players/players";
import Trades from '../Trades/trades';
import Leagues from "../Leagues/leagues";
import Leaguemates from "../Leaguemates/leaguemates";
import Lineups from "../Lineups/lineups";


const Main = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const { isLoadingUser, errorUser, user } = useSelector((state) => state.user);
    const { tab, state, projections, allPlayers: stateAllPlayers, nflSchedule: stateNflSchedule, projectionDict, isLoadingProjectionDict } = useSelector(state => state.main);
    const { rankings, includeTaxi, includeLocked, week, syncing } = useSelector(state => state.lineups)
    const { isLoadingData } = useSelector(state => state.filteredData);

    const hash = `${includeTaxi}-${includeLocked}`;


    console.log(Object.keys(projectionDict?.[hash] || {}));
    console.log(isLoadingProjectionDict)

    useEffect(() => {
        const fetchdata = async () => {
            try {
                if (params.username !== user.username) {
                    dispatch(resetState());
                    await dispatch(fetchUser(params.username));
                }
            } catch (error) {
                console.log(error)
            }
        }
        fetchdata()
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


    useEffect(() => {


        if (user?.user_id && (!projectionDict[hash]) && !isLoadingProjectionDict) {
            const worker = new Worker('/getRecordDictWeekWorker.js');

            console.log('Getting Projection Dict for week ' + week)

            dispatch(setState({ isLoadingProjectionDict: true }, 'MAIN'));
            const w = 'All';
            worker.postMessage({
                user,
                w,
                includeTaxi,
                includeLocked,
                projections,
                stateAllPlayers,
                stateNflSchedule,
                rankings,
                projectionDict
            });
            const result_dict = {};

            worker.onmessage = (e) => {
                console.log({ e: e })
                const result = e.data;

                result_dict[result.week] = result.data
                dispatch(
                    setState({
                        projectionDict: {
                            ...projectionDict,
                            [hash]: {
                                ...projectionDict[hash],
                                ...result_dict
                            },
                            edited: false
                        }
                    }, 'MAIN')
                );

                if (!(result.week < 18)) {
                    dispatch(setState({ isLoadingProjectionDict: false }, 'MAIN'));

                    return () => worker.terminate();
                }
            };
        } else if (syncing && !isLoadingProjectionDict) {
            const worker = new Worker('/getRecordDictWeekWorker.js');



            dispatch(setState({ isLoadingProjectionDict: true }, 'MAIN'));
            const w = 'Sync';
            worker.postMessage({
                user,
                w,
                includeTaxi,
                includeLocked,
                projections,
                stateAllPlayers,
                stateNflSchedule,
                rankings,
                projectionDict,
                syncing
            });
            let result_dict = projectionDict[hash];

            worker.onmessage = (e) => {
                console.log({ syncing: syncing })
                const result = e.data;

                result_dict[result.week] = {
                    ...result_dict[result.week],
                    ...result.data
                }
                dispatch(
                    setState({
                        projectionDict: {
                            ...projectionDict,
                            [hash]: result_dict
                        }
                    }, 'MAIN')
                );

                if (!(result.week < 18)) {
                    dispatch(setState({ isLoadingProjectionDict: false }, 'MAIN'));
                    dispatch(setState({ syncing: false }, 'LINEUPS'))
                    return () => worker.terminate();
                }
            }
        }

    }, [
        user?.leagues,
        projections,
        stateAllPlayers,
        stateNflSchedule,
        rankings,
        includeTaxi,
        includeLocked,
        projectionDict,
        dispatch
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
            display = !isLoadingData && <Lineups /> || loadingIcon
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