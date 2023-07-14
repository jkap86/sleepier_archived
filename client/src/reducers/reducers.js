import { combineReducers } from 'redux';
import userReducer from './userReducer';
import playersReducer from './playersReducer';
import leaguesReducer from './leaguesReducer';
import filteredDataReducer from './filteredDataReducer';
import dynastyValuesReducer from './valuesReducer';
import statsReducer from './statsReducer';
import lmTradesReducer from './lmTradesReducer';
import filteredLmTradesReducer from './filteredLmTradesReducer';
import pricecheckTradesReducer from './pricecheckTradesReducer';
import lineupsReducer from './lineupsReducer';
import mainReducer from './mainReducer';
import tradesReducer from './tradesReducer';
import leaguematesReducer from './leaguematesReducer';


const rootReducer = combineReducers({
    user: userReducer,
    main: mainReducer,
    filteredData: filteredDataReducer,
    players: playersReducer,
    trades: tradesReducer,
    leagues: leaguesReducer,
    leaguemates: leaguematesReducer,
    lineups: lineupsReducer,
    dynastyValues: dynastyValuesReducer,
    stats: statsReducer

});

export default rootReducer;


