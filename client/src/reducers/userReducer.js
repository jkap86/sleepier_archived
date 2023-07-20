

const initialState = {
    isLoadingUser: false,
    user: {},
    errorUser: null,
    syncing: false,
    errorSyncing: null
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_USER_START':
            return { ...state, isLoadingUser: true, errorUser: null };
        case 'FETCH_USER_SUCCESS':
            const user_id = action.payload.user_id;

            const leagues = action.payload.leagues
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
            return {
                ...state,
                isLoadingUser: false,
                user: {
                    ...action.payload,
                    leagues: leagues
                },

            };
        case 'FETCH_USER_FAILURE':
            return { ...state, isLoadingUser: false, errorUser: action.payload };
        case 'SYNC_LEAGUES_START':
            return { ...state, syncing: true, errorSyncing: null };
        case 'SYNC_LEAGUES_SUCCESS':
            console.log(action.payload.league_id)
            const updated_leagues = state.user.leagues.map(l => {
                if (l.league_id === action.payload.league_id) {
                    return action.payload
                }
                return l
            })
            return {
                ...state,
                user: {
                    ...state.user,
                    leagues: updated_leagues
                },
                syncing: false
            }
        case 'SYNC_LEAGUES_FAILURE':
            return { ...state, syncing: false, errorSyncing: action.payload }
        case 'SET_TAB':
            return {
                ...state,
                tab: action.payload
            };
        case 'SET_TYPE1':
            return {
                ...state,
                type1: action.payload
            };
        case 'SET_TYPE2':
            return {
                ...state,
                type2: action.payload
            };


        case 'RESET_STATE':
            return {
                ...initialState
            };
        default:
            return state;
    }
};

export default userReducer;
