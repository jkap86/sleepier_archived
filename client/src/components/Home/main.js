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


const Main = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const { isLoadingUser, errorUser, user } = useSelector((state) => state.user);
    const { tab, state, projections, allPlayers: stateAllPlayers, nflSchedule: stateNflSchedule, projectionDict, isLoadingProjectionDict } = useSelector(state => state.main);
    const { rankings, includeTaxi, includeLocked, week } = useSelector(state => state.lineups)
    const { isLoadingData } = useSelector(state => state.filteredData);



    console.log({ projectionDict: projectionDict })
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
        const worker = new Worker('/getRecordDictWeekWorker.js');
        const hash = `${includeTaxi}-${includeLocked}`;

        if (user?.user_id) {
            dispatch(setState({ isLoadingProjectionDict: true }, 'MAIN'));
            worker.postMessage({
                user,
                week,
                includeTaxi,
                includeLocked,
                projections,
                stateAllPlayers,
                stateNflSchedule,
                rankings,
                projectionDict
            });

            worker.onmessage = (e) => {
                console.log({ e: e })
                const result = e.data;
                dispatch(setState({
                    projectionDict: result,
                    isLoadingProjectionDict: false
                }, 'MAIN'));
            };
            return () => worker.terminate();
        }
    }, [
        user?.leagues,
        week,
        projections,
        stateAllPlayers,
        stateNflSchedule,
        rankings,
        includeTaxi,
        includeLocked,
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