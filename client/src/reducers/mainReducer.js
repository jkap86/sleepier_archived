const initialState = {
    state: {},
    allPlayers: {},
    nflSchedule: {},
    projections: {},
    projectionDict: {},
    tab: 'players',
    type1: 'All',
    type2: 'All',
    isLoadingProjections: false
};

const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_MAIN_SUCCESS':
            console.log('Main Reducer')
            const projections = Object.fromEntries(Object.keys(action.payload.projections)
                .map(week => {
                    return [
                        week,
                        Object.fromEntries(
                            action.payload.projections[week]
                                .map(proj => [proj.player_id, proj])
                        )
                    ]
                })
            )

            return {
                ...state,
                state: action.payload.state,
                allPlayers: action.payload.allplayers,
                nflSchedule: action.payload.schedule,
                projections: projections
            };
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
        case 'SET_STATE_MAIN':
            return {
                ...state,
                ...action.payload
            };
        case 'RESET_STATE':
            return {
                ...initialState
            };
        default:
            return state;
    }
};

export default mainReducer;