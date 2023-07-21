import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TableMain from '../Home/tableMain';
import PlayerModal from "./playerModal";
import PlayerLeagues from "./playerLeagues";
import headshot from '../../images/headshot.png';
import { getLocalDate } from '../Home/functions/dates';
import { fetchStats, fetchValues, setState } from '../../actions/actions';
import '../css/players.css';
import { loadingIcon, ppr_scoring_settings, getTrendColor, category_dropdown } from "../Home/functions/misc";
import { draftClassFilterIcon, positionFilterIcon, teamFilterIcon } from "../Home/functions/filterIcons";
import { filterLeagues } from "../Home/functions/filterLeagues";
import { getPlayerScore } from "../Home/functions/getPlayerScore";
import TrendModal from "./trendModal";

const Players = ({ }) => {
    const dispatch = useDispatch();
    const { isLoadingUser, errorUser, user } = useSelector((state) => state.user);
    const { state, type1, type2, allPlayers } = useSelector(state => state.main);
    const { filteredData } = useSelector(state => state.filteredData);
    const players = useSelector(state => state.players)
    const { stats } = useSelector(state => state.stats)
    const { dynastyValues } = useSelector(state => state.dynastyValues)
    const modalRef = useRef(null)
    const playerModalRef = useRef(null)
    const initialLoadRef = useRef(null);


    const leagues = user?.leagues || []

    const playersharesFiltered = filteredData?.players || []

    const filteredLeagueCount = filterLeagues(leagues, type1, type2)?.length

    useEffect(() => {

        if (players.trendDateStart && players.trendDateEnd && playersharesFiltered?.length > 0) {

            dispatch(fetchStats(players.trendDateStart, players.trendDateEnd, playersharesFiltered.map(player => player.id)))

            dispatch(fetchValues(players.trendDateStart, players.trendDateEnd))

        }
    }, [players.trendDateStart, players.trendDateEnd, playersharesFiltered, dispatch])

    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [players.modalVisible.options])

    useEffect(() => {
        if (playerModalRef.current) {
            playerModalRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [players.modalVisible.player])



    useEffect(() => {

        if (!initialLoadRef.current) {
            initialLoadRef.current = true
        } else {
            dispatch(setState({ page: 1 }, 'PLAYERS'))
        }
    }, [players.searched, type1, type2, dispatch])



    const playerShares_headers = [
        [
            {
                text: <> Player</>,
                colSpan: 10,

            },

            {
                text: 'Owned',
                colSpan: 5,
            },
            {
                text: category_dropdown(players.statType1, (statType) => dispatch(setState({ statType1: statType }, 'PLAYERS')), leagues, players.statType1, players.statType2),
                colSpan: 3,
                className: 'small'
            },
            {
                text: category_dropdown(players.statType2, (statType) => dispatch(setState({ statType2: statType }, 'PLAYERS')), leagues, players.statType1, players.statType2),
                colSpan: 3,
                className: 'small'
            },
            {
                text: 'GP',
                colSpan: 2
            },
            {
                text: 'PPG',
                colSpan: 2,
            }
        ]
    ]

    const getPlayerSharesBody = useCallback((dynastyValues, trendDateStart, trendDateEnd, type1, type2, statType1, statType2, filteredLeagueCount) => {
        return (playersharesFiltered || [])
            ?.map(player => {
                let pick_name;
                let ktc_name;
                let cur_value;
                let prev_value;
                let stat_trend1;
                let stat_trend2;
                let trend_games;
                if (player.id?.includes('_')) {
                    const pick_split = player.id.split('_')
                    pick_name = `${pick_split[0]} ${pick_split[1]}.${pick_split[2].toLocaleString("en-US", { minimumIntegerDigits: 2 })}`
                    ktc_name = `${pick_split[0]} ${parseInt(pick_split[2]) <= 4 ? 'Early' : parseInt(pick_split[2]) >= 9 ? 'Late' : 'Mid'} ${pick_split[1]}`


                    cur_value = dynastyValues
                        ?.find(dr => getLocalDate(dr.date) === getLocalDate(trendDateEnd))
                        ?.values[ktc_name]


                    prev_value = dynastyValues
                        ?.find(dr => getLocalDate(dr.date) === getLocalDate(trendDateStart))
                        ?.values[ktc_name]

                } else {
                    cur_value = dynastyValues
                        ?.find(dr => dr.date.toString() === trendDateEnd.toString())
                        ?.values[player.id]


                    prev_value = dynastyValues
                        ?.find(dr => dr.date.toString() === trendDateStart.toString())
                        ?.values[player.id]

                    trend_games = stats?.[player.id]
                        ?.filter(
                            s =>
                                s.stats.tm_off_snp > 0
                                && ((s.stats.snp || s.stats.off_snp || 0) / (s.stats.tm_off_snp) * 100 >= players.snapPercentageMin)
                                && ((s.stats.snp || s.stats.off_snp || 0) / (s.stats.tm_off_snp) * 100 <= players.snapPercentageMax)

                        ) || []



                    switch (statType1) {
                        case 'SF Dynasty (KTC)':
                            stat_trend1 = cur_value?.sf || '-'
                            break;
                        case 'SF Dynasty (FC)':
                            stat_trend1 = cur_value?.sf_dynasty_fc || '-'
                            break;
                        case 'SF Redraft (FC)':
                            stat_trend1 = cur_value?.sf_redraft_fc || '-'
                            break;
                        case '1QB Dynasty (KTC)':
                            stat_trend1 = cur_value?.oneqb || '-'
                            break;
                        case '1QB Dynasty (FC)':
                            stat_trend1 = cur_value?.oneqb_dynasty_fc || '-'
                            break;
                        case '1QB Redraft (FC)':
                            stat_trend1 = cur_value?.oneqb_redraft_fc || '-'
                            break;
                        case 'SF Trend Dynasty (KTC)':
                            stat_trend1 = (cur_value?.sf && prev_value?.sf && cur_value?.sf - prev_value?.sf) || '-'
                            break;
                        case 'SF Trend Dynasty (FC)':
                            stat_trend1 = (cur_value?.sf_dynasty_fc && prev_value?.sf_dynasty_fc && cur_value?.sf_dynasty_fc - prev_value?.sf_dynasty_fc) || '-'
                            break;
                        case 'SF Trend Redraft (FC)':
                            stat_trend1 = (cur_value?.sf_redraft_fc && prev_value?.sf_redraft_fc && cur_value?.sf_redraft_fc - prev_value?.sf_redraft_fc) || '-'
                            break;
                        case '1QB Trend Dynasty (KTC)':
                            stat_trend1 = (cur_value?.oneqb && prev_value?.oneqb && cur_value?.oneqb - prev_value?.oneqb) || '-'
                            break;
                        case '1QB Trend Dynasty (FC)':
                            stat_trend1 = (cur_value?.oneqb_dynasty_fc && prev_value?.oneqb_dynasty_fc && cur_value?.oneqb_dynasty_fc - prev_value?.oneqb_dynasty_fc) || '-'
                            break;
                        case '1QB Trend Redraft (FC)':
                            stat_trend1 = (cur_value?.oneqb_redraft_fc && prev_value?.oneqb_redraft_fc && cur_value?.oneqb_redraft_fc - prev_value?.oneqb_redraft_fc) || '-'
                            break;
                        default:
                            stat_trend1 = trend_games?.length > 0
                                && (trend_games?.reduce((acc, cur) => acc + (cur.stats?.[statType1] || 0), 0) / trend_games?.length)?.toFixed(1)
                                || '-'
                            break;
                    }

                    switch (statType2) {
                        case 'SF Dynasty (KTC)':
                            stat_trend2 = cur_value?.sf || '-'
                            break;
                        case 'SF Dynasty (FC)':
                            stat_trend2 = cur_value?.sf_dynasty_fc || '-'
                            break;
                        case 'SF Redraft (FC)':
                            stat_trend2 = cur_value?.sf_redraft_fc || '-'
                            break;
                        case '1QB Dynasty (KTC)':
                            stat_trend2 = cur_value?.oneqb || '-'
                            break;
                        case '1QB Dynasty (FC)':
                            stat_trend2 = cur_value?.oneqb_dynasty_fc || '-'
                            break;
                        case '1QB Redraft (FC)':
                            stat_trend2 = cur_value?.oneqb_redraft_fc || '-'
                            break;
                        case 'SF Trend Dynasty (KTC)':
                            stat_trend2 = (cur_value?.sf && prev_value?.sf && cur_value?.sf - prev_value?.sf) || '-'
                            break;
                        case 'SF Trend Dynasty (FC)':
                            stat_trend2 = (cur_value?.sf_dynasty_fc && prev_value?.sf_dynasty_fc && cur_value?.sf_dynasty_fc - prev_value?.sf_dynasty_fc) || '-'
                            break;
                        case 'SF Trend Redraft (FC)':
                            stat_trend2 = (cur_value?.sf_redraft_fc && prev_value?.sf_redraft_fc && cur_value?.sf_redraft_fc - prev_value?.sf_redraft_fc) || '-'
                            break;
                        case '1QB Trend Dynasty (KTC)':
                            stat_trend2 = (cur_value?.oneqb && prev_value?.oneqb && cur_value?.oneqb - prev_value?.oneqb) || '-'
                            break;
                        case '1QB Trend Dynasty (FC)':
                            stat_trend2 = (cur_value?.oneqb_dynasty_fc && prev_value?.oneqb_dynasty_fc && cur_value?.oneqb_dynasty_fc - prev_value?.oneqb_dynasty_fc) || '-'
                            break;
                        case '1QB Trend Redraft (FC)':
                            stat_trend2 = (cur_value?.oneqb_redraft_fc && prev_value?.oneqb_redraft_fc && cur_value?.oneqb_redraft_fc - prev_value?.oneqb_redraft_fc) || '-'
                            break;
                        default:
                            stat_trend2 = trend_games?.length > 0
                                && (trend_games?.reduce((acc, cur) => acc + (cur.stats?.[statType1] || 0), 0) / trend_games?.length)?.toFixed(1)
                                || '-'
                            break;
                    }

                    const leagues_owned = filterLeagues(player.leagues_owned, type1, type2);
                    const leagues_taken = filterLeagues(player.leagues_taken, type1, type2);
                    const leagues_available = filterLeagues(player.leagues_available, type1, type2);


                    return {
                        id: player.id,
                        search: {
                            text: allPlayers[player.id] && `${allPlayers[player.id]?.full_name} ${allPlayers[player.id]?.position} ${allPlayers[player.id]?.team || 'FA'}` || pick_name,
                            image: {
                                src: player.id,
                                alt: 'player photo',
                                type: 'player'
                            }
                        },
                        list: [
                            {
                                text: player.id?.includes('_') ? pick_name : `${allPlayers[player.id]?.position} ${allPlayers[player.id]?.full_name} ${player.id?.includes('_') ? '' : allPlayers[player.id]?.team || 'FA'}` || `INACTIVE PLAYER`,
                                colSpan: 10,
                                className: 'left',
                                image: {
                                    src: allPlayers[player.id] ? player.id : headshot,
                                    alt: allPlayers[player.id]?.full_name || player.id,
                                    type: 'player'
                                }
                            },

                            {
                                text: leagues_owned?.length.toString(),
                                colSpan: 2
                            },
                            {
                                text: < em >
                                    {((leagues_owned?.length / filteredLeagueCount) * 100).toFixed(1) + '%'}
                                </em >,
                                colSpan: 3
                            },
                            {
                                text: <p
                                    className={statType1.includes('Trend') && (stat_trend1 > 0 ? ' green stat' : stat_trend1 < 0 ? ' red stat' : 'stat') || 'stat'}
                                    style={statType1.includes('Trend') && getTrendColor(stat_trend1, 1.5) || {}}
                                >
                                    {(statType1.includes('Trend') && stat_trend1 > 0 ? '+' : '') + stat_trend1}
                                </p>,
                                colSpan: 3,

                            },
                            {
                                text: <p
                                    className={statType2.includes('Trend') && (stat_trend2 > 0 ? 'green stat' : stat_trend2 < 0 ? 'red stat' : 'stat') || 'stat'}
                                    style={statType2.includes('Trend') && getTrendColor(stat_trend2, 1.5) || {}}
                                >
                                    {(statType2.includes('Trend') && stat_trend2 > 0 ? '+' : '') + stat_trend2}
                                </p>,
                                colSpan: 3,
                                className: "stat"

                            },
                            {
                                text: <p className="stat">{trend_games?.length || '-'}</p>,
                                colSpan: 2,
                                className: "stat"
                            },
                            {
                                text: <span
                                    className="player_score"
                                    onClick={
                                        (e) => {
                                            e.stopPropagation()
                                            dispatch(setState({
                                                itemActive: player.id,
                                                modalVisible: {
                                                    options: false,
                                                    player: {
                                                        ...allPlayers[player.id],
                                                        trend_games: trend_games,
                                                        scoring_settings: ppr_scoring_settings
                                                    },
                                                    player2: false
                                                }
                                            }, 'PLAYERS'))
                                        }
                                    }

                                >
                                    {
                                        trend_games?.length > 0
                                        && (trend_games?.reduce((acc, cur) => acc + cur.stats.pts_ppr, 0) / trend_games?.length)?.toFixed(1)
                                        || '-'
                                    }
                                </span>,
                                colSpan: 2,
                                className: "stat"

                            }
                        ],
                        secondary_table: (
                            <PlayerLeagues
                                leagues_owned={leagues_owned}
                                leagues_taken={leagues_taken}
                                leagues_available={leagues_available}
                                stateStats={stats}
                                trend_games={trend_games}
                                player_id={player.id}
                                allPlayers={allPlayers}
                                getPlayerScore={getPlayerScore}
                                playerModalVisible={players.modalVisible.player}
                                setPlayerModalVisible={(value) => dispatch(setState({ modalVisible: { ...players.modalVisible, player: value } }, 'PLAYERS'))}
                            />
                        )
                    }
                }
            })

    }, [playersharesFiltered, filterLeagues, stats])

    const playerShares_body = getPlayerSharesBody(dynastyValues, players.trendDateStart, players.trendDateEnd, type1, type2, players.statType1, players.statType2, filteredLeagueCount)
        ?.filter(x => x
            &&
            (
                x.id.includes('_') || allPlayers[x.id]
            ) && (
                !players.searched?.id || players.searched?.id === x.id
            ) && (
                players.filters.position === allPlayers[x.id]?.position
                || players.filters.position.split('/').includes(allPlayers[x.id]?.position?.slice(0, 1))
                || (
                    players.filters.position === 'Picks' && x.id?.includes('_')
                )
            ) && (
                players.filters.team === 'All' || allPlayers[x.id]?.team === players.filters.team
            ) && (
                players.filters.draftClass === 'All' || parseInt(players.filters.draftClass) === (state.league_season - allPlayers[parseInt(x.id)]?.years_exp)
            )
        )
        .sort(
            (a, b) => (players.sortBy === players.statType1.replace(/_/g, ' ')
                ? (parseFloat(b.list[3].text.props.children) || 0) - (parseFloat(a.list[3].text.props.children) || 0)
                : players.sortBy === players.statType2.replace(/_/g, ' ')
                    ? (parseFloat(b.list[4].text.props.children) || 0) - (parseFloat(a.list[4].text.props.children) || 0)
                    : players.sortBy === 'PPG'
                        ? (parseFloat(b.list[5].text.props.children[1]) || 0) - (parseFloat(a.list[5].text.props.children[1]) || 0)
                        : players.sortBy === 'GP'
                            ? (parseInt(b.list[6].text.props.children) || 0) - (parseInt(a.list[6].text.props.children) || 0)

                            : (parseInt(b.list[1].text) || 0) - (parseInt(a.list[1].text) || 0)

            ) || parseInt(a.id.split('_')[0]) - parseInt(b.id.split('_')[0])
                || parseInt(a.id.split('_')[1]) - parseInt(b.id.split('_')[1])
                || parseInt(a.id.split('_')[2]) - parseInt(b.id.split('_')[2])
        )



    const teamFilter = teamFilterIcon(players.filters.team, (team) => dispatch(setState({ filters: { ...players.filters, team: team } }, 'PLAYERS')))

    const positionFilter = positionFilterIcon(players.filters.position, (pos) => dispatch(setState({ filters: { ...players.filters, position: pos } }, 'PLAYERS')), true)

    const player_ids = playersharesFiltered?.filter(p => parseInt(allPlayers[parseInt(p.id)]?.years_exp) >= 0)?.map(p => parseInt(p.id))

    const draftClassYears = Array.from(
        new Set(
            player_ids
                ?.map(player_id => state.league_season - allPlayers[parseInt(player_id)]?.years_exp)
        )
    )?.sort((a, b) => b - a)

    const draftClassFilter = draftClassFilterIcon(players.filters.draftClass, (dc) => dispatch(setState({ filters: { ...players.filters, draftClass: dc } }, 'PLAYERS')), draftClassYears)

    return isLoadingUser
        ? loadingIcon
        : errorUser
            ? <h1>{errorUser.error}</h1>
            : <>
                {
                    players.modalVisible.options ?
                        <TrendModal
                            modalRef={modalRef}
                        />
                        :
                        null
                }

                <div className="trend-range">
                    <label className="sort">
                        <i class="fa-solid fa-beat fa-sort click"></i>
                        <select
                            className="hidden_behind click"
                            onChange={(e) => dispatch(setState({ sortBy: e.target.value }, 'PLAYERS'))}
                            value={players.sortBy}
                        >
                            <option>OWNED</option>
                            <option>{players.statType1.replace(/_/g, ' ')}</option>
                            <option>{players.statType2.replace(/_/g, ' ')}</option>
                            <option>PPG</option>
                            <option>GP</option>
                        </select>
                    </label>
                    &nbsp;
                    {new Date(new Date(players.trendDateStart).getTime() + new Date().getTimezoneOffset() * 60000).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                    &nbsp;-&nbsp;
                    {new Date(new Date(players.trendDateEnd).getTime() + new Date().getTimezoneOffset() * 60000).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                    &nbsp;<label className="sort">
                        <i
                            className="fa-solid fa-filter fa-beat click"
                            onClick={async () => dispatch(setState({ modalVisible: { options: true, player: false, player2: false } }, 'PLAYERS'))}
                        >
                        </i>
                    </label>
                </div>
                <div className="relative">
                    {
                        !players.modalVisible.player ?
                            null
                            :
                            <div className="modal"  >
                                <PlayerModal
                                    setPlayerModalVisible={(value) => dispatch(setState({ modalVisible: { options: false, player: value, player2: false } }, 'PLAYERS'))}
                                    player={players.modalVisible.player}
                                    getPlayerScore={getPlayerScore}
                                    ref={playerModalRef}
                                />
                            </div>
                    }
                    <TableMain
                        id={'Players'}
                        type={'primary'}
                        headers={playerShares_headers}
                        body={playerShares_body}
                        page={players.page}
                        setPage={(page) => dispatch(setState({ page: page }, 'PLAYERS'))}
                        itemActive={players.itemActive}
                        setItemActive={(item) => dispatch(setState({ itemActive: item }, 'PLAYERS'))}
                        search={true}
                        searched={players.searched}
                        setSearched={(searched) => dispatch(setState({ searched: searched }, 'PLAYERS'))}
                        options1={[teamFilter]}
                        options2={[positionFilter, draftClassFilter]}

                    />
                </div>
            </>
}

export default Players;