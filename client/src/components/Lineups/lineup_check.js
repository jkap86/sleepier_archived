import TableMain from "../Home/tableMain";
import { getLineupCheck } from "../Home/functions/getLineupCheck";
import { useState, useEffect, useMemo } from "react";
import Lineup from "./lineup";
import { useSelector } from 'react-redux';
import { includeTaxiIcon, includeLockedIcon } from "../Home/functions/filterIcons";
import { filterLeagues } from "../Home/functions/filterLeagues";

const LineupCheck = ({
    tab,
    setTab,
    syncLeague
}) => {
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')
    const { user: state_user } = useSelector(state => state.user)
    const { type1, type2, allPlayers: stateAllPlayers, state: stateState, nflSchedule: stateNflSchedule, projections } = useSelector(state => state.main);
    const { filteredData } = useSelector(state => state.filteredData)
    const { rankings } = useSelector(state => state.lineups)
    const [includeTaxi, setIncludeTaxi] = useState(true)
    const [includeLocked, setIncludeLocked] = useState(true);
    const [recordType, setRecordType] = useState('starters_proj')

    const stateLeagues = filteredData?.lineups

    useEffect(() => {
        setPage(1)
    }, [searched, type1, type2])

    const projectedRecordDict = useMemo(() => {
        let projectedRecordDict = {};

        (stateLeagues || [])
            .forEach(league => {
                const matchups = league[`matchups_${stateState.display_week}`]

                const matchup = matchups?.find(m => m.roster_id === league.userRoster.roster_id)
                const opponentMatchup = matchups?.find(m => m.matchup_id === matchup.matchup_id && m.roster_id !== matchup.roster_id)

                const userLineup = matchup && getLineupCheck(matchup, league, stateAllPlayers, rankings, projections, stateNflSchedule[stateState.display_week], includeTaxi, includeLocked)
                const oppLineup = opponentMatchup && getLineupCheck(opponentMatchup, league, stateAllPlayers, rankings, projections, stateNflSchedule[stateState.display_week], includeTaxi, includeLocked)

                const user_starters_actual = matchup?.starters?.reduce((acc, cur) => acc + (matchup.players_points[cur] || 0), 0)
                const opp_starters_actual = opponentMatchup?.starters?.reduce((acc, cur) => acc + (opponentMatchup.players_points[cur] || 0), 0)

                const user_starters_proj = matchup?.starters?.reduce((acc, cur) => acc + (userLineup.players_projections[cur] || 0), 0)
                const opp_starters_proj = opponentMatchup?.starters?.reduce((acc, cur) => acc + (oppLineup.players_projections[cur] || 0), 0)

                const user_optimal_actual = userLineup?.optimal_lineup?.reduce((acc, cur) => acc + matchup.players_points[cur.player], 0)
                const opp_optimal_actual = oppLineup?.optimal_lineup?.reduce((acc, cur) => acc + opponentMatchup.players_points[cur.player], 0)

                const user_optimal_proj = userLineup?.optimal_lineup?.reduce((acc, cur) => acc + (userLineup.players_projections[cur.player] || 0), 0)
                const opp_optimal_proj = oppLineup?.optimal_lineup?.reduce((acc, cur) => acc + oppLineup.players_projections[cur.player], 0)

                projectedRecordDict[league.league_id] = {
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

        return projectedRecordDict
    }, [stateLeagues, projections])

    console.log({ projectedRecordDict: projectedRecordDict })

    const lineups_headers = [
        [
            {
                text: 'League',
                colSpan: 6,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Proj',
                className: 'half',
                colSpan: 1,
                rowSpan: 2
            },
            {
                text: '#Slots',
                colSpan: 8,
                className: 'half'
            }

        ],
        [
            {
                text: 'Suboptimal',
                colSpan: 2,
                className: 'small half'
            },
            {
                text: <p>Early in Flex</p>,
                colSpan: 2,
                className: 'small half'
            },
            {
                text: <p>Late not in Flex</p>,
                colSpan: 2,
                className: 'small half'
            },
            {
                text: <p className="end">Non QBs in SF</p>,
                colSpan: 2,
                className: 'small half'
            }
        ]
    ]


    const lineups_body = filterLeagues((stateLeagues || []), type1, type2)
        ?.filter(l => !searched.id || searched.id === l.league_id)
        ?.map(league => {
            const matchups = league[`matchups_${stateState.display_week}`]

            const matchup = matchups?.find(m => m.roster_id === league.userRoster.roster_id)
            const opponentMatchup = matchups?.find(m => m.matchup_id === matchup.matchup_id && m.roster_id !== matchup.roster_id)

            let opponent;
            if (opponentMatchup) {
                const opponentRoster = league.rosters.find(r => r?.roster_id === opponentMatchup?.roster_id)
                opponent = {
                    roster: opponentRoster,
                    matchup: opponentMatchup
                }


            }
            let lineups = matchup && getLineupCheck(matchup, league, stateAllPlayers, rankings, projections, stateNflSchedule[stateState.display_week], includeTaxi, includeLocked)
            const optimal_lineup = lineups?.optimal_lineup
            const lineup_check = lineups?.lineup_check
            const starting_slots = lineups?.starting_slots
            const players_points = { ...lineups?.players_points, ...opponentMatchup?.players_points }
            const players_projections = { ...lineups?.players_projections, ...opponentMatchup?.players_projections }

            console.log(recordType)

            return {
                id: league.league_id,
                search: {
                    text: league.name,
                    image: {
                        src: league.avatar,
                        alt: league.name,
                        type: 'league'
                    }
                },
                list: [
                    {
                        text: league.name,
                        colSpan: 6,
                        className: 'left',
                        image: {
                            src: league.avatar,
                            alt: league.name,
                            type: 'league'
                        }
                    },
                    {
                        text: projectedRecordDict[league.league_id][recordType].wins ? 'W'
                            : projectedRecordDict[league.league_id][recordType].losses ? 'L'
                                : projectedRecordDict[league.league_id][recordType].ties ? 'T'
                                    : '-',
                        colSpan: 1,
                        className: projectedRecordDict[league.league_id][recordType].wins ? 'greenb'
                            : projectedRecordDict[league.league_id][recordType].losses ? 'redb'
                                : ''
                    },
                    {
                        text: !matchup?.matchup_id || !lineup_check ? '-' : lineup_check.filter(x => x.notInOptimal).length > 0 ?
                            lineup_check.filter(x => x.notInOptimal).length :
                            '√',
                        colSpan: 2,
                        className: !matchup?.matchup_id || !lineup_check ? '' : lineup_check.filter(x => x.notInOptimal).length > 0 ?
                            'red' : 'green'
                    },
                    {
                        text: !matchup?.matchup_id || !lineup_check ? '-' : lineup_check.filter(x => x.earlyInFlex).length > 0 ?
                            lineup_check.filter(x => x.earlyInFlex).length :
                            '√',
                        colSpan: 2,
                        className: !matchup?.matchup_id || !lineup_check ? '' : lineup_check.filter(x => x.earlyInFlex).length > 0 ?
                            'red' : 'green'
                    },
                    {
                        text: !matchup?.matchup_id || !lineup_check ? '-' : lineup_check.filter(x => x.lateNotInFlex).length > 0 ?
                            lineup_check.filter(x => x.lateNotInFlex).length :
                            '√',
                        colSpan: 2,
                        className: !matchup?.matchup_id || !lineup_check ? '' : lineup_check.filter(x => x.lateNotInFlex).length > 0 ?
                            'red' : 'green'
                    },
                    {
                        text: !matchup?.matchup_id || !lineup_check ? '-' : lineup_check.filter(x => x.nonQBinSF).length > 0 ?
                            lineup_check.filter(x => x.nonQBinSF).length :
                            '√',
                        colSpan: 2,
                        className: !matchup?.matchup_id || !lineup_check ? '' : lineup_check.filter(x => x.nonQBinSF).length > 0 ?
                            'red' : 'green'
                    }

                ],
                secondary_table: (
                    <Lineup
                        matchup={matchup}
                        opponent={opponent}
                        starting_slots={starting_slots}
                        league={league}
                        optimal_lineup={optimal_lineup}
                        players_points={players_points}
                        players_projections={players_projections}
                        stateAllPlayers={stateAllPlayers}
                        state_user={state_user}
                        lineup_check={lineup_check}
                        syncLeague={syncLeague}
                        searched={searched}
                        setSearched={setSearched}
                        stateState={stateState}
                        stateNflSchedule={stateNflSchedule}
                        projectedRecordDict={projectedRecordDict}
                        recordType={recordType}
                    />
                )
            }
        })

    const projectedRecord = filterLeagues((stateLeagues || []), type1, type2)
        .reduce((acc, cur) => {
            return {
                wins: acc.wins + projectedRecordDict[cur.league_id][recordType].wins,
                losses: acc.losses + projectedRecordDict[cur.league_id][recordType].losses,
                ties: acc.ties + projectedRecordDict[cur.league_id][recordType].ties,
                fpts: acc.fpts + projectedRecordDict[cur.league_id][recordType].fpts,
                fpts_against: acc.fpts_against + projectedRecordDict[cur.league_id][recordType].fpts_against
            }
        }, {
            wins: 0,
            losses: 0,
            ties: 0,
            fpts: 0,
            fpts_against: 0
        })
    return <>
        <div className='navbar'>
            <p className='select'>
                {tab}&nbsp;<i class="fa-solid fa-caret-down"></i>
            </p>

            <select
                className='trades'
                onChange={(e) => setTab(e.target.value)}
                value={tab}

            >
                <option>Weekly Rankings</option>
                <option>Lineup Check</option>
            </select>
        </div>
        <h1>
            Week {stateState.display_week}

        </h1>
        <h2>
            <table className="summary">
                <tbody>
                    <tr>
                        <th>Type</th>
                        <td>
                            <select
                                className={'record_type'}
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value)}
                            >
                                <option value={'starters_proj'}>Starters Proj</option>
                                <option value={'optimal_proj'}>Optimal Proj</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Record</th>
                        <td>{projectedRecord.wins}-{projectedRecord.losses}</td>
                    </tr>
                    <tr>
                        <th>Points For</th>
                        <td>{projectedRecord.fpts.toLocaleString("en-US", { maximumIntegerDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <th>Points Against</th>
                        <td>{projectedRecord.fpts_against.toLocaleString("en-US", { maximumIntegerDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>


        </h2>
        <TableMain
            id={'Lineups'}
            type={'primary'}
            headers={lineups_headers}
            body={lineups_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
            search={true}
            searched={searched}
            setSearched={setSearched}
            options2={[includeLockedIcon(includeLocked, setIncludeLocked)]}
            options1={[includeTaxiIcon(includeTaxi, setIncludeTaxi)]}
        />
    </>
}

export default LineupCheck;