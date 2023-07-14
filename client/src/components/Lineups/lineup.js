import TableMain from "../Home/tableMain";
import { useState, useEffect } from "react";
import tumbleweedgif from '../../images/tumbleweed.gif';
import { matchTeam } from "../Home/functions/misc";
import { useSelector, useDispatch } from 'react-redux';
import { syncLeague } from '../../actions/actions';
import { getPlayerScore } from '../Home/functions/getPlayerScore';

const Lineup = ({
    matchup,
    opponent,
    starting_slots,
    league,
    optimal_lineup,
    stateAllPlayers,
    lineup_check,
    players_points,
    players_projections,
    stateState,
    stateNflSchedule,
    projectedRecordDict,
    recordType
}) => {
    const dispatch = useDispatch()
    const [itemActive, setItemActive] = useState(null);
    const [syncing, setSyncing] = useState(false)
    const [secondaryContent, setSecondaryContent] = useState('Optimal')
    const { rankings: uploadedRankings } = useSelector(state => state.lineups)
    const { projections } = useSelector(state => state.main)

    console.log(projectedRecordDict)

    const active_player = lineup_check?.find(x => `${x.slot}_${x.index}` === itemActive)?.current_player

    const rankings = uploadedRankings || projections

    useEffect(() => {
        if (itemActive) {
            setSecondaryContent('Options')
        } else {
            setSecondaryContent('Optimal')
        }
    }, [itemActive])

    const handleSync = (league_id, user_id) => {
        setSyncing(true)
        dispatch(syncLeague(league_id, user_id))
        setTimeout(() => {
            setSyncing(false)
        }, 5000)
    }


    const user_starters_proj = projectedRecordDict[league.league_id][recordType].fpts.toFixed(2);
    const user_optimal_proj = projectedRecordDict[league.league_id][recordType].fpts.toFixed(2);

    const opp_starters_proj = projectedRecordDict[league.league_id][recordType].fpts_against.toFixed(2);
    const opp_optimal_proj = projectedRecordDict[league.league_id][recordType].fpts_against.toFixed(2);

    const lineup_headers = [
        [
            {
                text: projectedRecordDict[league.league_id].starters_proj.fpts.toFixed(2),
                colSpan: 23,
                className: 'half'
            }
        ],
        [
            {
                text: 'Slot',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 10,
                className: 'half'
            },
            {
                text: 'Opp',
                colSpan: 3,
                className: 'half'
            },
            {
                text: uploadedRankings ? 'Rank' : 'Proj',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Points',
                colSpan: 4,
                className: 'half'
            }
        ]
    ]

    const lineup_body = lineup_check?.map((slot, index) => {
        const color = (
            !optimal_lineup.find(x => x.player === slot.current_player) ? 'red'
                : slot.earlyInFlex || slot.lateNotInFlex ? 'yellow'
                    : ''
        )
        return {
            id: slot.slot_index,
            list: !matchup ? [] : [
                {
                    text: lineup_check.find(x => x.current_player === slot.current_player)?.slot,
                    colSpan: 3,
                    className: color
                },
                {
                    text: stateAllPlayers[slot.current_player]?.full_name || 'Empty',
                    colSpan: 10,
                    className: color + " left",
                    image: {
                        src: slot.current_player,
                        alt: stateAllPlayers[slot.current_player]?.full_name,
                        type: 'player'
                    }
                },
                {
                    text: matchTeam(stateNflSchedule[stateState.display_week]
                        ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[slot.current_player]?.team))
                        ?.team
                        ?.find(team => matchTeam(team.id) !== stateAllPlayers[slot.current_player]?.team)
                        ?.id) || 'FA',
                    colSpan: 3,
                    className: color
                },
                {
                    text: uploadedRankings
                        ? rankings[slot.current_player]?.prevRank || 999
                        : players_projections[slot.current_player] || '-',
                    colSpan: 3,
                    className: color
                },
                {
                    text: players_points[slot.current_player]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '-',
                    colSpan: 4,
                    className: color
                }
            ]
        }
    })

    const subs_headers = [
        [
            {
                text: (
                    secondaryContent === 'Optimal'
                        ? projectedRecordDict[league.league_id].optimal_proj.fpts.toFixed(2)
                        : secondaryContent === 'Opp-Lineup'
                            ? projectedRecordDict[league.league_id].starters_proj.fpts_against.toFixed(2)
                            : secondaryContent === 'Opp-Optimal'
                                ? projectedRecordDict[league.league_id].optimal_proj.fpts_against.toFixed(2)
                                : ''
                ),
                colSpan: 23,
                className: 'half'
            }
        ],
        [
            {
                text: 'Slot',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 10,
                className: 'half'
            },
            {
                text: 'Opp',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Points',
                colSpan: 4,
                className: 'half'
            }
        ]
    ]

    const subs_body = itemActive && secondaryContent === 'Options' ?
        [

            {
                id: 'warning',
                list: [
                    {
                        text: lineup_check.find(x => x.slot_index === itemActive)?.current_player === '0' ? 'Empty Slot' :
                            lineup_check.find(x => x.slot_index === itemActive)?.notInOptimal ? 'Move Out Of Lineup' :
                                lineup_check.find(x => x.slot_index === itemActive)?.earlyInFlex ? 'Move Out Of Flex' :
                                    lineup_check.find(x => x.slot_index === itemActive)?.lateNotInFlex ? 'Move Into Flex'
                                        : '√',
                        colSpan: 23,
                        className: lineup_check.find(x => x.slot_index === itemActive)?.notInOptimal ? 'red'
                            : lineup_check.find(x => x.slot_index === itemActive)?.earlyInFlex || lineup_check.find(x => x.slot_index === itemActive)?.lateNotInFlex ? 'yellow'
                                : 'green'
                    }
                ]

            },

            ...lineup_check.find(x => x.slot_index === itemActive)?.slot_options
                ?.sort((a, b) => (rankings[a]?.prevRank || 999) - (rankings[b]?.prevRank || 999))
                ?.map((so, index) => {
                    const color = optimal_lineup.find(x => x.player === so) ? 'green' :
                        stateAllPlayers[so]?.rank_ecr < stateAllPlayers[active_player]?.rank_ecr ? 'yellow' : ''
                    return {
                        id: so,
                        list: [
                            {
                                text: 'BN',
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: stateAllPlayers[so]?.full_name || 'Empty',
                                colSpan: 10,
                                className: color + " left",
                                image: {
                                    src: so,
                                    alt: stateAllPlayers[so]?.full_name,
                                    type: 'player'
                                }
                            },
                            {
                                text: '-',
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: uploadedRankings
                                    ? rankings[so]?.prevRank || 999
                                    : getPlayerScore([projections[so]], league.scoring_settings, true) || '-',
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: players_points[so].toLocaleString("en-US", { minimumFractionDigits: 2 }),
                                colSpan: 4,
                                className: color
                            }
                        ]
                    }
                })
        ]
        : secondaryContent === 'Opp-Lineup' ?
            opponent?.matchup?.starters?.map((opp_starter, index) => {
                return {
                    id: opp_starter,
                    list: [
                        {
                            text: lineup_check[index]?.slot,
                            colSpan: 3
                        },
                        {
                            text: stateAllPlayers[opp_starter]?.full_name || 'Empty',
                            colSpan: 10,
                            className: 'left',
                            image: {
                                src: opp_starter,
                                alt: stateAllPlayers[opp_starter]?.full_name,
                                type: 'player'
                            }
                        },
                        {
                            text: '-',
                            colSpan: 3,
                        },
                        {
                            text: uploadedRankings
                                ? rankings[opp_starter]?.prevRank || 999
                                : getPlayerScore([projections[opp_starter]], league.scoring_settings, true) || '-',
                            colSpan: 3
                        },
                        {
                            text: opponent.matchup.players_points[opp_starter]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '-',
                            colSpan: 4
                        }
                    ]
                }
            })
            : secondaryContent === 'Opp-Optimal' ?
                projectedRecordDict[league.league_id].oppLineup?.optimal_lineup?.map((opp_starter, index) => {
                    return {
                        id: opp_starter.player || opp_starter,
                        list: [
                            {
                                text: lineup_check[index]?.slot,
                                colSpan: 3
                            },
                            {
                                text: stateAllPlayers[opp_starter.player || opp_starter]?.full_name || 'Empty',
                                colSpan: 10,
                                className: 'left',
                                image: {
                                    src: opp_starter.player || opp_starter,
                                    alt: stateAllPlayers[opp_starter.player || opp_starter]?.full_name,
                                    type: 'player'
                                }
                            },
                            {
                                text: '-',
                                colSpan: 3,
                            },
                            {
                                text: uploadedRankings
                                    ? rankings[opp_starter.player || opp_starter]?.prevRank || 999
                                    : getPlayerScore([projections[opp_starter.player || opp_starter]], league.scoring_settings, true) || '-',
                                colSpan: 3
                            },
                            {
                                text: opponent.matchup.players_points[opp_starter.player || opp_starter]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '-',
                                colSpan: 4
                            }
                        ]
                    }
                })
                : optimal_lineup?.map((ol, index) => {
                    return {
                        id: ol.player,
                        list: [
                            {
                                text: ol.slot,
                                colSpan: 3,
                                className: 'green'
                            },
                            {
                                text: stateAllPlayers[ol.player]?.full_name,
                                colSpan: 10,
                                className: 'left green',
                                image: {
                                    src: ol.player,
                                    alt: stateAllPlayers[ol.player]?.full_name,
                                    type: 'player'
                                }
                            },
                            {
                                text: '-',
                                colSpan: 3,
                                className: 'green'
                            },
                            {
                                text: uploadedRankings
                                    ? rankings[ol.player]?.prevRank || 999
                                    : getPlayerScore([projections[ol.player]], league.scoring_settings, true) || '-',
                                colSpan: 3,
                                className: 'green'
                            },
                            {
                                text: players_points[ol.player]?.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                                colSpan: 4,
                                className: 'green'
                            }
                        ]
                    }
                })


    return <>
        <div className="secondary nav">
            <div>
                <button>
                    Lineup
                </button>
            </div>
            <button
                className={`sync ${syncing ? '' : 'click'}`}
                onClick={syncing ? null : () => handleSync(league.league_id, league.userRoster.user_id)}
            >
                <i className={`fa-solid fa-arrows-rotate ${syncing ? 'rotate' : ''}`}></i>
            </button>
            <div>
                {
                    itemActive
                        ? <button
                            className={secondaryContent === 'Options' ? 'active click' : !itemActive ? 'inactive' : 'click'}
                            onClick={itemActive ? () => setSecondaryContent('Options') : null}
                        >
                            Options
                        </button>
                        : <>
                            <button
                                className={secondaryContent === 'Optimal' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Optimal')}
                            >
                                Optimal
                            </button>

                            <button
                                className={secondaryContent === 'Opp-Lineup' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Opp-Lineup')}
                            >
                                Opp-Lineup
                            </button>
                            <button
                                className={secondaryContent === 'Opp-Optimal' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Opp-Optimal')}
                            >
                                Opp-Optimal
                            </button>
                        </>
                }

            </div>
        </div>
        {
            lineup_body?.length > 0 ?
                <>
                    <TableMain
                        type={'secondary lineup'}
                        headers={lineup_headers}
                        body={lineup_body}
                        itemActive={itemActive}
                        setItemActive={(setItemActive)}
                    />

                    <TableMain
                        type={'secondary subs'}
                        headers={subs_headers}
                        body={subs_body}
                    />
                </>
                :
                <div>
                    <h1>No Matchups</h1>
                    <img src={tumbleweedgif} alt={'tumbleweed gif'} className='gif' />
                </div>
        }
    </>
}

export default Lineup;