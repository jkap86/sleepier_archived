import TableMain from "../Home/tableMain";
import { memo, useRef, useEffect, useMemo } from "react"
import LeaguematePlayersLeagues from "./leaguematePlayersLeagues"
import TradeTipRosters from "../Trades/tradeTipRosters";
import { useSelector, useDispatch } from 'react-redux';
import { setState } from "../../actions/actions";

const LeaguemateLeagues = ({ leaguemate }) => {
    const dispatch = useDispatch();
    const { user: state_user } = useSelector(state => state.user)
    const { allPlayers: stateAllPlayers } = useSelector(state => state.main)
    const leaguemates = useSelector(state => state.leaguemates);
    const initialLoadRef = useRef(null);


    useEffect(() => {
        if (!initialLoadRef.current) {
            initialLoadRef.current = true
        } else {
            dispatch(setState({ page_players: 1 }, 'LEAGUEMATES'))
        }
    }, [leaguemates.searched_players, dispatch])


    const playersCount = useMemo(() => {
        const players_all = []

        leaguemate.leagues.map(league => {
            return league.lmRoster.players.map(player => {
                return players_all.push({
                    id: player,
                    league: league,
                    type: 'lm',
                    wins: league.lmRoster.settings.wins,
                    losses: league.lmRoster.settings.losses,
                    ties: league.lmRoster.settings.ties
                })
            }) &&
                league.userRoster.players.map(player => {
                    return players_all.push({
                        id: player,
                        league: league,
                        type: 'user',
                        wins: league.userRoster.settings.wins,
                        losses: league.userRoster.settings.losses,
                        ties: league.userRoster.settings.ties
                    })
                })
        })

        const players_count = []

        players_all.map(player => {
            const index = players_count.findIndex(obj => {
                return obj.id === player.id
            })
            if (index === -1) {
                let leagues_lm = players_all.filter(x => x.id === player.id && x.type === 'lm')
                let leagues_user = players_all.filter(x => x.id === player.id && x.type === 'user')

                const lm_record = leagues_lm.reduce((acc, cur) => {
                    return {
                        wins: acc.wins + cur.wins,
                        losses: acc.losses + cur.losses,
                        ties: acc.ties + cur.ties
                    }
                }, {
                    wins: 0,
                    losses: 0,
                    ties: 0
                })

                const user_record = leagues_user.reduce((acc, cur) => {
                    return {
                        wins: acc.wins + cur.wins,
                        losses: acc.losses + cur.losses,
                        ties: acc.ties + cur.ties
                    }
                }, {
                    wins: 0,
                    losses: 0,
                    ties: 0
                })

                players_count.push({
                    id: player.id,
                    leagues_lm: leagues_lm,
                    lm_record: lm_record,
                    leagues_user: leagues_user,
                    user_record: user_record
                })
            }
        })

        return players_count;

    }, [leaguemate])
    const leaguemateLeagues_headers = [
        [
            {
                text: 'League',
                colSpan: 4,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: leaguemate.username,
                colSpan: 4,
                className: 'half'
            },
            {
                text: state_user.username,
                colSpan: 4,
                className: 'half'
            }
        ],
        [
            {
                text: 'Record',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Record',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 2,
                className: 'half'
            }
        ]
    ]

    const leaguemateLeagues_body = leaguemate.leagues.map((lm_league) => {
        return {
            id: lm_league.league_id,
            list: [
                {
                    text: lm_league.name,
                    colSpan: 4,
                    className: 'left',
                    image: {
                        src: lm_league.avatar,
                        alt: 'avatar',
                        type: 'league'
                    }
                },
                {
                    text: `${lm_league.lmRoster.settings.wins}-${lm_league.lmRoster.settings.losses}${lm_league.lmRoster.ties > 0 ? `-${lm_league.lmRoster.ties}` : ''}`,
                    colSpan: 2

                },
                {
                    text: lm_league.lmRoster.rank,
                    colSpan: 2,
                    className: lm_league.lmRoster.rank / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.lmRoster.rank / lm_league.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: `${lm_league.userRoster.settings.wins}-${lm_league.userRoster.settings.losses}${lm_league.userRoster.ties > 0 ? `-${lm_league.userRoster.ties}` : ''}`,
                    colSpan: 2
                },
                {
                    text: lm_league.userRoster.rank,
                    colSpan: 2,
                    className: lm_league.userRoster.rank / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.userRoster.rank / lm_league.rosters.length >= .75 ? 'red' :
                            null
                }
            ],
            secondary_table: (
                <TradeTipRosters
                    userRoster={lm_league.userRoster}
                    lmRoster={lm_league.lmRoster}
                    roster_positions={lm_league.roster_positions}
                />
            )
        }
    })

    const leaguematePlayers_headers = [
        [
            {
                text: 'Player',
                colSpan: 4,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: leaguemate.username,
                colSpan: 4,
                onClick: () => dispatch(setState({ sortBy: 'Leaguemate' }, 'LEAGUEMATES')),
                className: 'half'
            },
            {
                text: state_user.username,
                colSpan: 4,
                onClick: () => dispatch(setState({ sortBy: 'User' }, 'LEAGUEMATES')),
                className: 'half'
            }
        ],
        [
            {
                text: 'Count',
                colSpan: 1,
                className: 'small half',
                onClick: () => dispatch(setState({ sortBy: 'Leaguemate' }, 'LEAGUEMATES')),
            },
            {
                text: 'Record',
                colSpan: 3,
                className: 'small half',
                onClick: () => dispatch(setState({ sortBy: 'Leaguemate' }, 'LEAGUEMATES')),
            },
            {
                text: 'Count',
                colSpan: 1,
                className: 'small half',
                onClick: () => dispatch(setState({ sortBy: 'User' }, 'LEAGUEMATES')),
            },
            {
                text: 'Record',
                colSpan: 3,
                className: 'small half',
                onClick: () => dispatch(setState({ sortBy: 'User' }, 'LEAGUEMATES')),
            }
        ]
    ]

    const leaguematePlayers_body = playersCount
        .filter(player => !leaguemates.searched_players.id || player.id === leaguemates.searched_players.id)
        .sort((a, b) => leaguemates.sortBy === 'Leaguemate'
            ? b.leagues_lm?.length - a.leagues_lm?.length
            : b.leagues_user?.length - a.leagues_user?.length
        )
        .map(player => {
            const lm_wins = player.lm_record.wins;
            const lm_losses = player.lm_record.losses;
            const lm_ties = player.lm_record.ties;

            const user_wins = player.user_record.wins;
            const user_losses = player.user_record.losses;
            const user_ties = player.user_record.ties;

            return {
                id: player.id,
                search: {
                    text: stateAllPlayers[player.id]?.full_name,
                    image: {
                        src: player.id,
                        alt: 'player headshot',
                        type: 'player'
                    }
                },
                list: [
                    {
                        text: stateAllPlayers[player.id]?.full_name,
                        colSpan: 4,
                        className: 'left',
                        image: {
                            src: player.id,
                            alt: 'player headshot',
                            type: 'player'
                        }
                    },
                    {
                        text: stateAllPlayers[player.id] && player.leagues_lm.length || '0',
                        colSpan: 1
                    },
                    {
                        text: stateAllPlayers[player.id] && (lm_wins + '-' + lm_losses + (lm_ties > 0 ? `-${lm_ties}` : '')),
                        colSpan: 3
                    },
                    {
                        text: stateAllPlayers[player.id] && player.leagues_user.length || '0',
                        colSpan: 1
                    },
                    {
                        text: stateAllPlayers[player.id] && (user_wins + '-' + user_losses + (user_ties > 0 ? `-${user_ties}` : '')),
                        colSpan: 3
                    }
                ],
                secondary_table: (
                    <LeaguematePlayersLeagues
                        leagues_lm={player.leagues_lm}
                        leagues_user={player.leagues_user}
                        leaguemate={leaguemate}
                    />
                )

            }
        })


    return <>
        <div className="secondary nav">
            <div>
                <button
                    className={leaguemates.secondaryContent === 'Leagues' ? 'active click' : 'click'}
                    onClick={() => dispatch(setState({ secondaryContent: 'Leagues' }, 'LEAGUEMATES'))}
                >
                    Leagues
                </button>
                <button
                    className={leaguemates.secondaryContent === 'Players' ? 'active click' : 'click'}
                    onClick={() => dispatch(setState({ secondaryContent: 'Players' }, 'LEAGUEMATES'))}
                >
                    Players
                </button>
            </div>
        </div>
        <TableMain
            id={'Players'}
            type={'secondary'}
            headers={leaguemates.secondaryContent === 'Leagues' ? leaguemateLeagues_headers : leaguematePlayers_headers}
            body={leaguemates.secondaryContent === 'Leagues' ? leaguemateLeagues_body : leaguematePlayers_body}
            page={leaguemates.secondaryContent === 'Leagues' ? leaguemates.page_leagues : leaguemates.page_players}
            setPage={(page) => leaguemates.secondaryContent === 'Leagues' ? dispatch(setState({ page_leagues: page }, 'LEAGUEMATES')) : dispatch(setState({ page_players: page }, 'LEAGUEMATES'))}
            itemActive={leaguemates.secondaryContent === 'Leagues' ? leaguemates.itemActive_leagues : leaguemates.itemActive_players}
            setItemActive={(itemActive) => leaguemates.secondaryContent === 'Leagues' ? dispatch(setState({ itemActive_leagues: itemActive }, 'LEAGUEMATES')) : dispatch(setState({ itemActive_players: itemActive }, 'LEAGUEMATES'))}
            search={leaguemates.secondaryContent === 'Players' ? true : false}
            searched={leaguemates.searched_players}
            setSearched={(searched) => dispatch(setState({ searched_players: searched }, 'LEAGUEMATES'))}
        />
    </>
}


export default memo(LeaguemateLeagues, (prevLm, nextLm) => {
    return prevLm.leaguemate.user_id === nextLm.leaguemate.user_id
});
