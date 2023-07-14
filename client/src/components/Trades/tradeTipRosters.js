import { useState } from "react"
import TableMain from "../Home/tableMain"
import { useSelector } from "react-redux";

const TradeTipRosters = ({
    userRoster,
    lmRoster,
    roster_positions
}) => {
    const [filterUser, setFilterUser] = useState('All')
    const [filterLm, setFilterLm] = useState('All')
    const { state: stateState, allPlayers: stateAllPlayers } = useSelector(state => state.main)

    console.log({
        userRoster: userRoster,
        lmRoster: lmRoster
    })
    const headers = (roster, setFilter) => {
        return [
            [
                {
                    text: roster.username,
                    colSpan: 17,
                    className: 'half'
                },
                {
                    text: <select onChange={(e) => setFilter(e.target.value)}>
                        <option>All</option>
                        <option>QB</option>
                        <option>RB</option>
                        <option>WR</option>
                        <option>TE</option>
                        <option>Picks</option>
                    </select>,
                    colSpan: 5,
                    className: 'half'
                }
            ],
            [
                {
                    text: 'Slot',
                    colSpan: 5,
                    className: 'half'
                },
                {
                    text: 'Player',
                    colSpan: 12,
                    className: 'half'

                },
                {
                    text: 'Age',
                    colSpan: 5,
                    className: 'half'
                }
            ]
        ]
    }
    const position_abbrev = {
        'QB': 'QB',
        'RB': 'RB',
        'WR': 'WR',
        'TE': 'TE',
        'SUPER_FLEX': 'SF',
        'FLEX': 'WRT',
        'WRRB_FLEX': 'W R',
        'WRRB_WRT': 'W R',
        'REC_FLEX': 'W T'
    }


    const body = (roster, filter) => {
        let players;

        if (filter === 'Picks') {
            return roster.draft_picks
                ?.sort((a, b) => a.season - b.season || a.round - b.round || a.order - b.order)
                ?.map(pick => {
                    return {
                        id: `${pick.season}_${pick.round}_${pick.original_user.user_id}`,
                        list: [
                            {
                                text: <span>&nbsp;&nbsp;{`${pick.season} Round ${pick.round}${(pick.order && pick.season === parseInt(stateState.league_season)) ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : pick.original_user.user_id === roster?.user_id ? '' : `(${pick.original_user?.username || 'Orphan'})`}`.toString()}</span>,
                                colSpan: 22,
                                className: 'left'
                            }
                        ]

                    }
                })
        } else {
            if (filter === 'All') {
                players = [...roster.starters, ...roster.players.filter(p => !roster.starters.includes(p))]
            } else {
                players = roster.players.filter(player_id => stateAllPlayers[player_id]?.position === filter)
            }


            return players?.map((player_id, index) => {
                return {
                    id: player_id,
                    list: [
                        {
                            text: filter === 'All' ? roster_positions && position_abbrev[roster_positions[index]] || roster_positions && roster_positions[index] || 'BN' : stateAllPlayers[player_id]?.position,
                            colSpan: 5
                        },

                        {
                            text: stateAllPlayers[player_id]?.full_name,
                            colSpan: 12,
                            className: 'left',
                            image: {
                                src: player_id,
                                alt: 'player headshot',
                                type: 'player'
                            }
                        },
                        {
                            text: stateAllPlayers[player_id]?.age,
                            colSpan: 5
                        }
                    ]
                }
            })
        }

    }

    return <>
        <TableMain
            type={'tertiary subs'}
            headers={headers(userRoster, setFilterUser)}
            body={body(userRoster, filterUser)}
        />
        <TableMain
            type={'tertiary subs'}
            headers={headers(lmRoster, setFilterLm)}
            body={body(lmRoster, filterLm)}
        />
    </>
}

export default TradeTipRosters;