import { avatar } from './functions/misc';
import React from "react";
import '../css/heading.css';
import { useSelector, useDispatch } from 'react-redux';
import { setType1, setType2, setTab } from '../../actions/actions';
import { filterLeagues } from './functions/filterLeagues';

const Heading = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.user);
    const { tab, state: stateState, type1, type2, } = useSelector(state => state.main);



    const filteredLeagueCount = filterLeagues((user?.leagues || []), type1, type2)?.length


    return <>
        <div className="heading">

            <h1>
                {stateState.league_season}
            </h1>
            <h1>
                <p className="image">
                    {
                        user.avatar && avatar(user.avatar, user.display_name, 'user')
                    }
                    <strong>
                        {user.username}
                    </strong>
                </p>
            </h1>
            <div className="navbar">
                <p className='select'>
                    {tab}&nbsp;<i className="fa-solid fa-caret-down"></i>
                </p>
                <select
                    className="nav active click"
                    value={tab}
                    onChange={(e) => {
                        if (tab !== e.target.value) {
                            dispatch(setTab(e.target.value))
                        }
                    }}
                >
                    <option>players</option>
                    <option>trades</option>
                    <option>leagues</option>
                    <option>leaguemates</option>
                    <option>lineups</option>
                </select>

            </div>
            {
                tab === 'trades' ? null :
                    <div className="switch_wrapper">
                        <div className="switch">
                            <button className={type1 === 'Redraft' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType1('Redraft'))}>Redraft</button>
                            <button className={type1 === 'All' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType1('All'))}>All</button>
                            <button className={type1 === 'Dynasty' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType1('Dynasty'))}>Dynasty</button>
                        </div>
                        <div className="switch">
                            <button className={type2 === 'Bestball' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType2('Bestball'))}>Bestball</button>
                            <button className={type2 === 'All' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType2('All'))}>All</button>
                            <button className={type2 === 'Standard' ? 'sw active click' : 'sw click'} onClick={() => dispatch(setType2('Standard'))}>Standard</button>
                        </div>
                    </div>
            }
            <h2>
                {tab === 'trades' ? null : `${filteredLeagueCount} Leagues`}
            </h2>
        </div>
    </>
}

export default Heading;