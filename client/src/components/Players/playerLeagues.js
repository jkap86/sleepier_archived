import TableMain from "../Home/tableMain";
import { useState, useRef, useEffect } from "react";
//  import LeagueInfo from "../Leagues/leagueInfo";
import { useSelector, useDispatch } from 'react-redux';
import LeagueInfo from "../Leagues/leagueInfo";
import { setState } from "../../actions/actions";
import PlayerModal from "./playerModal";

const PlayerLeagues = ({
    leagues_owned,
    leagues_taken,
    leagues_available,
    trend_games,
    snapPercentageMin,
    snapPercentageMax,
    getPlayerScore,
    player_id
}) => {
    const dispatch = useDispatch();
    const players = useSelector(state => state.players)
    const { allPlayers: stateAllPlayers } = useSelector(state => state.main)
    const { stats: stateStats } = useSelector(state => state.stats)
    const playerModalRef = useRef(null)


    useEffect(() => {
        if (playerModalRef.current) {
            playerModalRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [players.modalVisible.player2])

    useEffect(() => {
        const handleExitModal = (ref, setState) => {
            return (event) => {
                if (!ref.current || !ref.current.contains(event.target)) {

                    setState(false)
                }
            }
        };


        const handleExitPlayerModal = handleExitModal(playerModalRef, (value) => dispatch(setState({ modalVisible: { ...players.modalVisible, player2: value } }, 'PLAYERS')))

        document.addEventListener('mousedown', handleExitPlayerModal)
        document.addEventListener('touchstart', handleExitPlayerModal)

        return () => {
            document.removeEventListener('mousedown', handleExitPlayerModal);
            document.removeEventListener('touchstart', handleExitPlayerModal);
        };
    }, [])

    let player_leagues_headers = [
        [
            {
                text: 'League',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 1
            },
            {
                text: 'PPG',
                colSpan: 1
            }
        ]
    ]

    if (players.tab.secondary === 'Taken') {
        player_leagues_headers[0].push(
            {
                text: 'Manager',
                colSpan: 2,
                className: 'half'
            }
        )
    }

    const leagues_display = players.tab.secondary === 'Owned' ? leagues_owned :
        players.tab.secondary === 'Taken' ? leagues_taken :
            players.tab.secondary === 'Available' ? leagues_available :
                null

    const player_leagues_body = leagues_display.map(lo => {
        const player_score = getPlayerScore(trend_games, lo.scoring_settings)
        return {
            id: lo.league_id,
            list: [
                {
                    text: lo.name,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: lo.avatar,
                        alt: lo.name,
                        type: 'league'
                    }
                },
                {
                    text: lo.userRoster?.rank,
                    colSpan: 1,
                    className: lo.userRoster?.rank / lo.rosters.length <= .25 ? 'green' :
                        lo.userRoster?.rank / lo.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: <span
                        className="player_score"
                        onClick={
                            (e) => {
                                e.stopPropagation()
                                dispatch(setState({
                                    modalVisible: {
                                        ...players.modalVisible,
                                        player2: {
                                            ...stateAllPlayers[player_id],
                                            trend_games: trend_games,
                                            scoring_settings: lo.scoring_settings,
                                            league: lo
                                        }
                                    }
                                }, 'PLAYERS'))
                            }
                        }
                    >
                        {
                            trend_games?.length > 0
                            && (Object.keys(player_score || {})
                                .reduce(
                                    (acc, cur) => acc + player_score[cur].points, 0) / trend_games.length)
                                .toFixed(1)
                            || '-'
                        }
                    </span>,
                    colSpan: 1
                },
                players.tab.secondary === 'Taken' ?
                    {
                        text: lo.lmRoster?.username || 'Orphan',
                        colSpan: 2,
                        className: 'left end',
                        image: {
                            src: lo.lmRoster?.avatar,
                            alt: lo.lmRoster?.username,
                            type: 'user'
                        }
                    }
                    : ''

            ],
            secondary_table: (
                <LeagueInfo
                    stateAllPlayers={stateAllPlayers}
                    scoring_settings={lo.scoring_settings}
                    league={lo}
                    trendStats={stateStats}
                    getPlayerScore={getPlayerScore}
                    snapPercentageMin={snapPercentageMin}
                    snapPercentageMax={snapPercentageMax}
                    setPlayerModalVisible2={(value) => dispatch(setState({ modalVisible: { ...players.modalVisible, player2: value } }, 'PLAYERS'))}
                    type='tertiary'

                />
            )
        }
    })


    return <>

        <div className="secondary nav">
            <button
                className={players.tab.secondary === 'Owned' ? 'active click' : 'click'}
                onClick={() => dispatch(setState({ tab: { ...players.tab, secondary: 'Owned' } }, 'PLAYERS'))}
            >
                Owned
            </button>
            <button
                className={players.tab.secondary === 'Taken' ? 'active click' : 'click'}
                onClick={() => dispatch(setState({ tab: { ...players.tab, secondary: 'Taken' } }, 'PLAYERS'))}
            >
                Taken
            </button>
            <button
                className={players.tab.secondary === 'Available' ? 'active click' : 'click'}
                onClick={() => dispatch(setState({ tab: { ...players.tab, secondary: 'Available' } }, 'PLAYERS'))}
            >
                Available
            </button>
        </div>
        <div className="relative">
            {
                !players.modalVisible.player2 ?
                    null
                    :
                    <div className="modal" ref={playerModalRef} >
                        <PlayerModal
                            setPlayerModalVisible={(value) => dispatch(setState({ modalVisible: { ...players.modalVisible, player2: value } }, 'PLAYERS'))}
                            player={{
                                ...stateAllPlayers[player_id],
                                ...players.modalVisible.player2
                            }}
                            getPlayerScore={getPlayerScore}
                            league={players.modalVisible.player2?.league}
                        />
                    </div>
            }
            <TableMain
                type={'secondary'}
                headers={player_leagues_headers}
                body={player_leagues_body}
                itemActive={players.itemActive2}
                setItemActive={(item) => dispatch(setState({ itemActive2: item }, 'PLAYERS'))}
                page={players.page2}
                setPage={(page) => dispatch(setState({ page2: page }, 'PLAYERS'))}
            />
        </div>
    </>
}

export default PlayerLeagues;