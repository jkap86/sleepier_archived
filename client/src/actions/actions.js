import axios from 'axios';
import { filterData } from '../components/Home/functions/filterData';
import { getTradeTips } from '../components/Home/functions/getTradeTips';


export const RESET_STATE = 'RESET_STATE';

export const resetState = () => ({
    type: RESET_STATE
});

export const setType1 = (type1) => ({
    type: 'SET_TYPE1',
    payload: type1,
});

export const setType2 = (type2) => ({
    type: 'SET_TYPE2',
    payload: type2,
});

export const setTab = (tab) => ({
    type: 'SET_TAB',
    payload: tab
});

export const setTrendDateStart = (date) => ({
    type: 'SET_TRENDDATESTART',
    payload: date
});

export const setTrendDateEnd = (date) => ({
    type: 'SET_TRENDDATEEND',
    payload: date
})

export const setItemActive = (item, tab) => ({
    type: `SET_ITEMACTIVE_${tab}`,
    payload: item
})

export const setPage = (page, tab) => ({
    type: `SET_PAGE_${tab}`,
    payload: page
})

export const setSearched = (searched, tab) => ({
    type: `SET_SEARCHED_${tab}`,
    payload: searched
})

export const setSortBy = (sortBy, tab) => ({
    type: `SET_SORTBY_${tab}`,
    payload: sortBy
})

export const setFilters = (filter_obj, tab) => ({
    type: `SET_FILTERS_${tab}`,
    payload: filter_obj
})

export const setState = (state_obj, tab) => ({
    type: `SET_STATE_${tab}`,
    payload: state_obj
})

export const fetchUser = (username) => {
    return async (dispatch) => {
        dispatch({ type: 'FETCH_USER_START' });

        let allplayers_timestamp;

        try {
            allplayers_timestamp = JSON.parse(localStorage.getItem('allplayers'))?.timestamp
        } catch (error) {
            console.log(error)
        }


        let projections_timestamp;

        try {
            projections_timestamp = JSON.parse(localStorage.getItem('projections'))?.timestamp
        } catch (error) {
            console.log(error)
        }

        try {
            const response = await axios.post('/user/create', {
                username: username,
                allplayers: allplayers_timestamp > (new Date().getTime() - 24 * 60 * 60 * 1000) ? false : true,
                projections: projections_timestamp > (new Date().getTime() - 15 * 60 * 1000) ? false : true
            });
            console.log(response.data)

            if (response.data.allplayers) {
                const allplayers_string = JSON.stringify({ data: response.data.allplayers, timestamp: new Date().getTime() });

                localStorage.setItem('allplayers', allplayers_string)
            }

            if (response.data.projections) {
                const projections_string = JSON.stringify({ data: response.data.projections, timestamp: new Date().getTime() });

                localStorage.setItem('projections', projections_string)
            }

            if (!response.data?.error) {
                dispatch({ type: 'FETCH_USER_SUCCESS', payload: response.data.user });

                dispatch({
                    type: 'FETCH_MAIN_SUCCESS', payload: {
                        state: response.data.state,
                        allplayers: JSON.parse(response.data.allplayers) || JSON.parse(JSON.parse(localStorage.getItem('allplayers')).data),
                        schedule: JSON.parse(response.data.schedule),
                        projections: JSON.parse(response.data.projections) || JSON.parse(JSON.parse(localStorage.getItem('projections')).data)
                    }
                });
            } else {
                dispatch({ type: 'FETCH_USER_FAILURE', payload: response.data });
            }
        } catch (error) {
            dispatch({ type: 'FETCH_USER_FAILURE', payload: error.message });
        }
    };
};

export const fetchLeagues = (user_id) => {
    return async (dispatch) => {
        dispatch({ type: 'FETCH_LEAGUES_START' });


        try {
            const [home, leagues] = await Promise.all([
                axios.get('/home'),
                axios.post('/league/find', { user_id: user_id }),
            ]);

            console.log(home.data)

            dispatch({
                type: 'FETCH_LEAGUES_SUCCESS', payload: {
                    state: home.data.state,
                    allPlayers: home.data.allplayers,
                    schedule: home.data.schedule,
                    projections: home.data.projections,
                    leagues: leagues.data
                        .filter(league => league.rosters
                            ?.find(r => r.user_id === user_id || r.co_owners?.find(co => co?.user_id === user_id))
                        )
                        .map(league => {
                            const userRoster = league.rosters
                                ?.find(r => r.user_id === user_id || r.co_owners?.find(co => co?.user_id === user_id))

                            return {
                                ...league,
                                userRoster: userRoster,
                            }

                        })
                }
            })

        } catch (error) {
            console.log(error)
            dispatch({ type: 'FETCH_LEAGUES_FAILURE', payload: error.message });
        }
    };
};



export const fetchFilteredData = (leagues, type1, type2, tab, season) => async (dispatch) => {
    dispatch({ type: 'FETCH_FILTERED_DATA_START' });

    try {
        const filteredData = filterData(leagues, type1, type2, tab, season);


        dispatch({
            type: 'FETCH_FILTERED_DATA_SUCCESS',
            payload: filteredData
        });
    } catch (error) {
        dispatch({ type: 'FETCH_FILTERED_DATA_FAILURE', payload: error.message });
    }
};

export const fetchStats = (trendDateStart, trendDateEnd, players, league) => async (dispatch) => {
    dispatch({ type: 'FETCH_STATS_START' })

    try {
        const stats = await axios.post('/dynastyrankings/stats', {
            players: players,
            date1: trendDateStart,
            date2: trendDateEnd
        });



        dispatch({ type: 'FETCH_STATS_SUCCESS', payload: { ...stats.data, league: league } })
    } catch (error) {
        dispatch({ type: 'FETCH_STATS_FAILURE', payload: error.message })
    }
};

export const fetchValues = (trendDateStart, trendDateEnd, dates) => async (dispatch, getState) => {
    dispatch({ type: 'FETCH_DYNASTY_VALUES_START' })

    let dynastyValues;
    try {
        if (dates) {
            dynastyValues = await axios.post('/dynastyrankings/findrange', {
                dates: dates
            })
        } else {
            dynastyValues = await axios.post('/dynastyrankings/find', {

                date1: trendDateStart,
                date2: trendDateEnd
            });
        }


        dispatch({ type: 'FETCH_DYNASTY_VALUES_SUCCESS', payload: dynastyValues.data })
    } catch (error) {
        dispatch({ type: 'FETCH_DYNASTY_VALUES_FAILURE', payload: error.message })
    }
};

export const syncLeague = (league_id, user_id, username, week) => {
    return async (dispatch) => {
        dispatch({ type: 'SYNC_LEAGUE_START' })

        try {
            const updated_league = await axios.post(`/league/sync`, {
                league_id: league_id,
                username: username,
                week: week
            })
            console.log({ updated_league: updated_league })
            const userRoster = updated_league.data.rosters
                ?.find(r => r.user_id === user_id || r.co_owners?.find(co => co?.user_id === user_id))

            dispatch({
                type: 'SYNC_LEAGUES_SUCCESS',
                payload: {
                    ...updated_league.data,
                    userRoster: userRoster
                }
            })
        } catch (error) {
            console.log(error)
            dispatch({ type: 'SYNC_LEAGUES_FAILURE' })
        }

    };
}

export const fetchLmTrades = (user_id, leagues, season, offset, limit) => {
    return async (dispatch) => {
        dispatch({ type: 'FETCH_TRADES_START' });

        try {
            const trades = await axios.post('/trade/leaguemate', {
                user_id: user_id,
                offset: offset,
                limit: limit
            })



            const trades_tips = getTradeTips(JSON.parse(trades.data.rows), leagues, season)
            console.log({ trades_tips: trades_tips })
            dispatch({
                type: 'FETCH_LMTRADES_SUCCESS', payload: {
                    count: trades.data.count,
                    trades: trades_tips
                }
            });
        } catch (error) {
            dispatch({ type: 'FETCH_TRADES_FAILURE', payload: error.message })
        }
    }
}

export const fetchFilteredLmTrades = (searchedPlayerId, searchedManagerId, league_season, offset, limit) => async (dispatch, getState) => {
    dispatch({ type: 'FETCH_TRADES_START' });

    const state = getState();

    const { user } = state;

    try {
        const trades = await axios.post('/trade/leaguemate', {
            user_id: user.user.user_id,
            player: searchedPlayerId,
            manager: searchedManagerId,
            offset: offset,
            limit: limit,
        });
        console.log(trades.data)
        const trades_tips = getTradeTips(trades.data.rows, user.leagues, league_season)
        console.log(trades_tips)
        dispatch({
            type: 'FETCH_FILTERED_LMTRADES_SUCCESS',
            payload: {
                player: searchedPlayerId,
                manager: searchedManagerId,
                trades: trades_tips,
                count: trades.data.count,
            },
        });
    } catch (error) {
        dispatch({ type: 'FETCH_TRADES_FAILURE', payload: error.message });
    }


};

export const fetchPriceCheckTrades = (pricecheck_player, pricecheck_player2, offset, limit) => async (dispatch, getState) => {
    dispatch({ type: 'FETCH_TRADES_START' });

    const state = getState();

    const { user, main } = state;

    try {
        const player_trades = await axios.post('/trade/pricecheck', {
            player: pricecheck_player,
            player2: pricecheck_player2,
            offset: offset,
            limit: limit
        })

        const trades_tips = getTradeTips(player_trades.data.rows, user.leagues, main.state.league_season)

        dispatch({
            type: 'FETCH_PRICECHECKTRADES_SUCCESS',
            payload: {
                pricecheck_player: pricecheck_player,
                pricecheck_player2: pricecheck_player2,
                trades: trades_tips,
                count: player_trades.data.count,
            },
        });
    } catch (error) {
        dispatch({ type: 'FETCH_TRADES_FAILURE', payload: error.message });
    }

};

export const uploadRankings = (uploadedRankings) => ({
    type: 'UPLOAD_RANKINGS',
    payload: uploadedRankings
})

export const updateSleeperRankings = (updatedRankings) => ({
    type: 'UPDATE_SLEEPER_RANKINGS',
    payload: updatedRankings
})

export const fetchProjections = (leagues_dict, week, user_id) => async (dispatch) => {

    dispatch({ type: 'FETCH_PROJECTIONS_START', payload: week })

    try {
        const projections = await axios.post('/league/matchups', {
            user_id: user_id,
            leagues_dict: leagues_dict,
            week: week
        })

        console.log({ projections: projections.data })

        dispatch({
            type: 'FETCH_PROJECTIONS_SUCCESS',
            payload: projections.data
        })
    } catch (error) {
        dispatch({ type: 'FETCH_PROJECTIONS_FAILURE', payload: error.message })
    }

}