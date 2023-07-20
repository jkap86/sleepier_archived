import { useState, useMemo, useEffect } from "react";
import WeeklyRankings from "./weekly_rankings";
import LineupCheck from "./lineup_check";
import { useSelector, useDispatch } from 'react-redux';
import '../css/lineups.css';
import { getLineupCheck } from "../Home/functions/getLineupCheck";
import { setState, fetchProjections } from "../../actions/actions";

const Lineups = ({
}) => {
    const dispatch = useDispatch();
    const [tab, setTab] = useState('Lineup Check')
    const { user } = useSelector(state => state.user)
    const { allPlayers: stateAllPlayers, state, nflSchedule: stateNflSchedule, projections } = useSelector(state => state.main)
    const { rankings, includeTaxi, includeLocked, projectedRecordDictAll, week } = useSelector(state => state.lineups)




    const display = tab === 'Weekly Rankings' ?
        <WeeklyRankings
            tab={tab}
            setTab={setTab}
        />
        :
        <LineupCheck
            tab={tab}
            setTab={setTab}

        />

    return <>
        <div className='navbar'>
            <p className='select click'>
                {tab}&nbsp;<i class="fa-solid fa-caret-down"></i>
            </p>

            <select
                className='trades click'
                onChange={(e) => setTab(e.target.value)}
                value={tab}

            >
                <option>Weekly Rankings</option>
                <option>Lineup Check</option>
            </select>
        </div>
        <h1>
            Week <select
                value={week}
                onChange={(e) => dispatch(setState({ week: e.target.value }, 'LINEUPS'))}
            >
                {
                    Array.from(Array(18).keys()).map(key =>
                        <option key={key + 1}>{key + 1}</option>
                    )
                }
            </select>

        </h1>
        {display}
    </>
}

export default Lineups;