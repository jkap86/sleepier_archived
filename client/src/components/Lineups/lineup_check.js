import TableMain from "../Home/tableMain";
import { getLineupCheck } from "../Home/functions/getLineupCheck";
import { useState, useEffect, useMemo } from "react";
import Lineup from "./lineup";
import { useSelector, useDispatch } from 'react-redux';
import { includeTaxiIcon, includeLockedIcon } from "../Home/functions/filterIcons";
import { filterLeagues } from "../Home/functions/filterLeagues";
import { setState } from "../../actions/actions";
import { loadingIcon } from "../Home/functions/misc";

const LineupCheck = ({
    tab,
    setTab,
    syncLeague
}) => {
    const dispatch = useDispatch();
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')
    const { user: state_user } = useSelector(state => state.user)
    const { type1, type2, allPlayers: stateAllPlayers, state: stateState, nflSchedule: stateNflSchedule, projectionDict, isLoadingProjectionDict } = useSelector(state => state.main);
    const { filteredData } = useSelector(state => state.filteredData)
    const { rankings, includeTaxi, includeLocked, week } = useSelector(state => state.lineups)
    const [recordType, setRecordType] = useState('starters_proj')



    const hash = `${includeTaxi}-${includeLocked}`;

    const stateLeagues = filteredData?.lineups

    useEffect(() => {
        setPage(1)
    }, [searched, type1, type2])


    const lineups_headers = [
        [
            {
                text: 'League',
                colSpan: 6,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: <>Pts<br />Rnk</ >,
                className: 'half small',
                colSpan: 1,
                rowSpan: 2
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

    console.log({ week: week })
    const lineups_body = filterLeagues((stateLeagues || []), type1, type2)
        ?.filter(l => !searched.id || searched.id === l.league_id)
        ?.flatMap(league => {
            const matchups = league[`matchups_${week}`]

            const matchup = matchups?.find(m => m.roster_id === league.userRoster.roster_id)
            const opponentMatchup = matchups?.find(m => m.matchup_id === matchup.matchup_id && m.roster_id !== matchup.roster_id)



            const opponentRoster = league.rosters.find(r => r?.roster_id === opponentMatchup?.roster_id)
            let opponent = {
                roster: opponentRoster,
                matchup: opponentMatchup
            }

            const userLineup = projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.userLineup;
            const oppLineup = projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.oppLineup;

            const optimal_lineup = userLineup?.optimal_lineup
            const lineup_check = userLineup?.lineup_check
            const starting_slots = userLineup?.starting_slots
            const players_points = { ...userLineup?.players_points, ...oppLineup?.players_points }
            const players_projections = { ...userLineup?.players_projections, ...oppLineup?.players_projections }

            const rank = Object.keys(projectionDict[hash]?.[week]?.[league.league_id] || {})
                .sort((a, b) => projectionDict[hash]?.[week]?.[league.league_id][b][recordType].fpts - projectionDict[hash]?.[week]?.[league.league_id][a][recordType].fpts)
                .indexOf(league.userRoster.roster_id.toString())


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
                        text: rank + 1 > 0 ? rank + 1 : '-',
                        colSpan: 1
                    },
                    {
                        text: projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.[recordType]?.wins ? 'W'
                            : projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.[recordType]?.losses ? 'L'
                                : projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.[recordType]?.ties ? 'T'
                                    : '-',
                        colSpan: 1,
                        className: projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.[recordType]?.wins ? 'greenb'
                            : projectionDict[hash]?.[week]?.[league.league_id]?.[league.userRoster.roster_id]?.[recordType]?.losses ? 'redb'
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
                        recordType={recordType}
                    />
                )
            }

        })

    const projectedRecord = filterLeagues((stateLeagues || []), type1, type2)
        .reduce((acc, cur) => {
            return {
                wins: acc.wins + (projectionDict[hash]?.[week]?.[cur.league_id]?.[cur.userRoster.roster_id][recordType].wins || 0),
                losses: acc.losses + (projectionDict[hash]?.[week]?.[cur.league_id]?.[cur.userRoster.roster_id][recordType].losses || 0),
                ties: acc.ties + (projectionDict[hash]?.[week]?.[cur.league_id]?.[cur.userRoster.roster_id][recordType].ties || 0),
                fpts: acc.fpts + (projectionDict[hash]?.[week]?.[cur.league_id]?.[cur.userRoster.roster_id][recordType].fpts || 0),
                fpts_against: acc.fpts_against + (projectionDict[hash]?.[week]?.[cur.league_id]?.[cur.userRoster.roster_id][recordType].fpts_against || 0),
            }
        }, {
            wins: 0,
            losses: 0,
            ties: 0,
            fpts: 0,
            fpts_against: 0
        })
    return isLoadingProjectionDict ? loadingIcon : <>
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
            options2={[includeLockedIcon(includeLocked, (value) => dispatch(setState({ includeLocked: value }, 'LINEUPS')))]}
            options1={[includeTaxiIcon(includeTaxi, (value) => dispatch(setState({ includeTaxi: value }, 'LINEUPS')))]}
        />
    </>
}

export default LineupCheck;