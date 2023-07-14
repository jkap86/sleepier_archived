import { useState, useEffect, useRef } from "react";
import TableMain from '../Home/tableMain';
import { loadingIcon, avatar, getTrendColor } from '../Home/functions/misc';
import TradeInfo from './tradeInfo';
import Search from '../Home/search';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFilteredLmTrades, fetchValues, fetchLmTrades, fetchPriceCheckTrades } from '../../actions/actions';
import '../css/trades.css';

const Trades = () => {
    const dispatch = useDispatch();
    const [tab, setTab] = useState('Leaguemate Trades');
    const [page, setPage] = useState(1);
    const [itemActive, setItemActive] = useState('');
    const [searched_player, setSearched_Player] = useState('')
    const [searched_league, setSearched_League] = useState('')
    const [searched_manager, setSearched_Manager] = useState('')
    const [pricecheck_player, setPricecheck_player] = useState('')
    const [pricecheck_player2, setPricecheck_player2] = useState('')

    const [tradesDisplay, setTradesDisplay] = useState([])
    const [tradeCount, setTradeCount] = useState(0)
    const { user } = useSelector((state) => state.user);
    const { state: stateState, allPlayers } = useSelector(state => state.main)
    const { lmTrades, isLoading: isLoadingLmTrades, error: errorLmTrades } = useSelector(state => state.lmTrades);
    const { isLoading: isLoadingFilteredLmTrades, searches, error } = useSelector(state => state.filteredLmTrades);
    const { dynastyValues: stateDynastyRankings } = useSelector(state => state.dynastyValues)
    const { pricecheckTrades, isLoading: isLoadingPricecheckTrades, error: errorPcTrades } = useSelector(state => state.pricecheckTrades);
    const loadRef = useRef();



    useEffect(() => {
        switch (tab) {
            case 'Leaguemate Trades':

                if (!searched_player?.id && !searched_manager?.id === '') {
                    setTradesDisplay(lmTrades.trades || [])
                    setTradeCount(lmTrades.count)


                } else {
                    let search_trades = searches?.find(s => s.player === searched_player.id && s.manager === searched_manager.id)

                    setTradesDisplay(search_trades?.trades || [])
                    setTradeCount(search_trades?.count)

                }
                break;
            case 'Price Check':
                const pcTrades = pricecheckTrades.find(pcTrade => pcTrade.pricecheck_player === pricecheck_player.id && pcTrade.pricecheck_player2 === pricecheck_player2.id)

                setTradesDisplay(pcTrades?.trades || [])
                setTradeCount(pcTrades?.count)

                break;
            default:
                break;
        }


    }, [tab, lmTrades, searches, pricecheckTrades, searched_player, searched_manager, searched_league, pricecheck_player, pricecheck_player2])

    useEffect(() => {
        //    setPage(1)

        setPage(Math.ceil((lmTrades.trades?.length - 125) / 25) + 1)
    }, [lmTrades])

    useEffect(() => {
        let trades = tradesDisplay
        const dates = trades.slice((page - 1) * 25, ((page - 1) * 25) + 25).map(trade => new Date(parseInt(trade.status_updated) - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])

        if (trades) {

            dispatch(fetchValues([...dates, new Date(new Date() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]], null))
        }

    }, [tradesDisplay, page])


    useEffect(() => {
        setSearched_Player('')
        setSearched_Manager('')
        setSearched_League('')
    }, [tab])

    useEffect(() => {
        if (!loadRef.current) {
            loadRef.current = true
        } else {
            setPage(1)
        }
    }, [searched_player, searched_league, searched_manager, pricecheck_player, pricecheck_player2, tab])

    useEffect(() => {
        if ((searched_player.id || searched_manager.id) && !searches.find(s => s.player === searched_player.id && s.manager === searched_manager.id)) {
            console.log(stateState.league_season)
            dispatch(fetchFilteredLmTrades(searched_player.id, searched_manager.id, stateState.league_season, 0, 125))
        }
    }, [searched_player, searched_manager])



    useEffect(() => {

        if (pricecheck_player !== '' && !pricecheckTrades.find(pc => pc.pricecheck_player === pricecheck_player.id && (pricecheck_player2 === '' || pc.pricecheck_player2 === pricecheck_player2.id))) {
            dispatch(fetchPriceCheckTrades(pricecheck_player.id, pricecheck_player2.id, 0, 125))
        }
    }, [pricecheck_player, pricecheck_player2])

    const trades_headers = [
        [
            {
                text: 'Date',
                colSpan: 3
            },
            {
                text: 'League',
                colSpan: 7
            }
        ]
    ]




    const eastern_time = new Date(new Date() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]


    const trades_body = tradesDisplay
        ?.sort((a, b) => parseInt(b.status_updated) - parseInt(a.status_updated))
        ?.map(trade => {
            return {
                id: trade.transaction_id,
                list: [

                    {
                        text: <TableMain
                            type={'trade_summary'}
                            headers={[]}
                            body={
                                [
                                    {
                                        id: 'title',
                                        list: [
                                            {
                                                text: new Date(parseInt(trade.status_updated)).toLocaleDateString('en-US') + ' ' + new Date(parseInt(trade.status_updated)).toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit" }),
                                                colSpan: 4,
                                                className: 'small'
                                            },
                                            {
                                                text: trade['league.name'],
                                                colSpan: 9,

                                                image: {
                                                    src: trade?.['league.avatar'],
                                                    alt: 'league avatar',
                                                    type: 'league'
                                                }
                                            },
                                        ]
                                    },
                                    ...trade.managers.map(rid => {
                                        const roster = trade.rosters?.find(r => r.user_id === rid)

                                        const cur_values = stateDynastyRankings
                                            .find(x => x.date === new Date(eastern_time).toISOString().split('T')[0])?.values || {}



                                        const trans_values = stateDynastyRankings
                                            .find(x => x.date === new Date(parseInt(trade.status_updated) - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])?.values


                                        const superflex = trade['league.roster_positions']?.filter(p => p === 'QB' || p === 'SUPER_FLEX').length > 1 ? true : false
                                        const trans_value = Object.keys(trade.adds || {}).filter(a => trade.adds[a] === roster?.user_id)
                                            .reduce((acc, cur) =>
                                                acc + parseInt(trans_values?.[cur]?.[superflex ? 'sf' : 'oneqb'] || 0)
                                                , 0)
                                            +
                                            trade.draft_picks.filter(p => p.owner_id === roster?.roster_id)
                                                .reduce((acc, cur) =>
                                                    acc + (trans_values && parseInt(trans_values?.[
                                                        `${cur.season} ${`${cur.order <= 4 ? 'Early' : cur.order >= 9 ? 'Late' : 'Mid'}`} ${cur.round}`
                                                    ]?.[superflex ? 'sf' : 'oneqb'] || 0)) || 0
                                                    , 0)




                                        const cur_value = Object.keys(trade.adds || {}).filter(a => trade.adds[a] === roster?.user_id)
                                            .reduce((acc, cur) => acc + parseInt(cur_values?.[cur]?.[superflex ? 'sf' : 'oneqb'] || 0), 0)
                                            +
                                            trade.draft_picks.filter(p => p.owner_id === roster?.roster_id)
                                                .reduce((acc, cur) =>
                                                    acc + (cur_values && parseInt(cur_values[
                                                        `${cur.season} ${`${cur.order <= 4 ? 'Early' : cur.order >= 9 ? 'Late' : 'Mid'}`} ${cur.round}`
                                                    ]?.[superflex ? 'sf' : 'oneqb'] || 0)) || 0
                                                    , 0)
                                        const trend = cur_value - trans_value

                                        return {
                                            id: trade.transaction_id,
                                            list: [

                                                {
                                                    text: <div className='trade_manager'>
                                                        <div>
                                                            <p className='value'>
                                                                KTC -&nbsp;
                                                                {
                                                                    trans_value.toLocaleString("en-US")
                                                                }
                                                            </p>
                                                            <p
                                                                className={(trend > 0 ? 'green trend' : trend < 0 ? 'red trend' : 'trend')}
                                                                style={getTrendColor(trend, 1.5)}
                                                            >
                                                                {
                                                                    trend > 0 ? '+' : ''
                                                                }
                                                                {
                                                                    trend.toString()
                                                                }

                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className='left'>
                                                                {
                                                                    avatar(
                                                                        roster?.avatar, 'user avatar', 'user'
                                                                    )
                                                                }
                                                                <span>{roster?.username || 'Orphan'}</span>
                                                            </p>
                                                        </div>
                                                    </div>,
                                                    colSpan: 4,
                                                    className: 'left trade_manager'
                                                },
                                                {
                                                    text: <table className='trade_info'>
                                                        <tbody>
                                                            {
                                                                Object.keys(trade.adds || {}).filter(a => trade.adds[a] === roster?.user_id).map(player_id => {
                                                                    const value = trans_values?.[player_id]?.[superflex ? 'sf' : 'oneqb'] || '-'
                                                                    const trend = cur_values?.[player_id] && trans_values?.[player_id] && (cur_values?.[player_id]?.[superflex ? 'sf' : 'oneqb'] - trans_values?.[player_id]?.[superflex ? 'sf' : 'oneqb'])
                                                                    return <tr>
                                                                        <td colSpan={11} className={
                                                                            `${trade.tips?.trade_away && trade.tips?.trade_away?.find(p => p.player_id === player_id)?.manager.user_id === rid

                                                                                ? 'red left'
                                                                                : 'left'
                                                                            }`
                                                                        } ><p><span >+ {allPlayers[player_id]?.full_name}</span></p></td>
                                                                        <td className='value'
                                                                            colSpan={4}>
                                                                            {value}
                                                                        </td>
                                                                        <td
                                                                            className={trend > 0 ? 'green stat value' : trend < 0 ? 'red stat value' : 'stat value'}
                                                                            style={getTrendColor(trend, 1)}
                                                                            colSpan={3}
                                                                        >
                                                                            {
                                                                                trend > 0 ? '+' : ''
                                                                            }
                                                                            {trend}
                                                                        </td>
                                                                    </tr>
                                                                })
                                                            }
                                                            {
                                                                trade.draft_picks
                                                                    .filter(p => p.owner_id === roster?.roster_id)
                                                                    .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                                                    .map(pick => {
                                                                        const ktc_name = `${pick.season} ${pick.order <= 4 ? 'Early' : pick.order >= 9 ? 'Late' : 'Mid'} ${pick.round}`

                                                                        const value = trans_values?.[ktc_name]?.[superflex ? 'sf' : 'oneqb'] || '-'
                                                                        const trend = cur_values?.[ktc_name] && trans_values?.[ktc_name] && ((cur_values?.[ktc_name]?.[superflex ? 'sf' : 'oneqb'] - trans_values?.[ktc_name]?.[superflex ? 'sf' : 'oneqb'])).toString() || '-'
                                                                        return <tr>
                                                                            <td
                                                                                colSpan={11}
                                                                                className={`${trade.tips?.trade_away && trade.tips?.trade_away
                                                                                    ?.find(p =>
                                                                                        p?.player_id?.season === pick.season
                                                                                        && p?.player_id?.round === pick.round
                                                                                        && p?.player_id?.order === pick.order
                                                                                    )?.manager?.user_id === rid ? 'red left' : 'left'}`}
                                                                            >
                                                                                {
                                                                                    <p><span>{`+ ${pick.season} Round ${pick.round}${pick.order && pick.season === stateState.league_season ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : ` (${pick.original_user?.username || 'Orphan'})`}`}</span></p>
                                                                                }
                                                                            </td>
                                                                            <td className='value' colSpan={4}>
                                                                                {
                                                                                    value
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                className={trend > 0 ? 'green stat value' : trend < 0 ? 'red stat value' : 'stat value'}
                                                                                style={getTrendColor(trend, 1.5)}
                                                                                colSpan={3}
                                                                            >
                                                                                {
                                                                                    cur_values?.[ktc_name]?.[superflex ? 'sf' : 'oneqb'] - trans_values?.[ktc_name]?.[superflex ? 'sf' : 'oneqb'] > 0 ? '+' : ''
                                                                                }
                                                                                {trend}
                                                                            </td>
                                                                        </tr>
                                                                    })
                                                            }
                                                        </tbody>
                                                    </table>,
                                                    colSpan: 5,
                                                    rowSpan: 2,
                                                    className: 'small'
                                                },
                                                {
                                                    text: <table className='trade_info'>
                                                        <tbody>
                                                            {
                                                                Object.keys(trade.drops || {}).filter(d => trade.drops[d] === roster?.user_id).map(player_id =>

                                                                    <tr
                                                                        className={
                                                                            `${trade.tips?.acquire && trade.tips?.acquire?.find(p => p.player_id === player_id)?.manager?.user_id === rid
                                                                                ? 'green'
                                                                                : ''
                                                                            }`
                                                                        }
                                                                    >
                                                                        <td className='left end' colSpan={4}>

                                                                            <p>
                                                                                <span className='end'>
                                                                                    {
                                                                                        (`- ${allPlayers[player_id]?.full_name}`).toString()
                                                                                    }
                                                                                </span>
                                                                            </p>

                                                                        </td>
                                                                    </tr>

                                                                )
                                                            }
                                                            {
                                                                trade.draft_picks
                                                                    .filter(p => p.previous_owner_id === roster?.roster_id)
                                                                    .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                                                    .map(pick =>
                                                                        <tr
                                                                            className={`end ${trade.tips?.acquire && trade.tips?.acquire
                                                                                ?.find(p =>
                                                                                    p?.player_id?.season === pick.season
                                                                                    && p?.player_id?.round === pick.round
                                                                                    && p?.player_id?.order === pick.order
                                                                                )?.manager?.user_id === rid ? 'green left' : 'left'}`}
                                                                        >
                                                                            <td colSpan={4} className='left end'>
                                                                                <p>
                                                                                    <span className="end">
                                                                                        {
                                                                                            (`- ${pick.season} Round ${pick.round}${pick.order && pick.season === stateState.league_season ? `.${pick.order.toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : ` (${pick.original_user?.username || 'Orphan'})`}`).toString()
                                                                                        }
                                                                                    </span>
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                            }
                                                        </tbody>
                                                    </table>,
                                                    colSpan: 4,
                                                    rowSpan: 2,
                                                    className: 'small'
                                                }
                                            ]

                                        }
                                    })

                                ]
                            }
                        />,
                        colSpan: 10,
                        className: `small `
                    }

                ],
                secondary_table: (
                    <TradeInfo
                        trade={trade}
                    />
                )
            }
        }) || []







    const picks_list = []

    Array.from(Array(4).keys()).map(season => {
        return Array.from(Array(5).keys()).map(round => {
            if (season !== 0) {
                return picks_list.push({
                    id: `${season + parseInt(stateState.league_season)} ${round + 1}.${null}`,
                    text: `${season + parseInt(stateState.league_season)}  Round ${round + 1}`,
                    image: {
                        src: null,
                        alt: 'pick headshot',
                        type: 'player'
                    }
                })
            } else {
                return Array.from(Array(12).keys()).map(order => {
                    return picks_list.push({
                        id: `${season + parseInt(stateState.league_season)} ${round + 1}.${season === 0 ? (order + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 }) : null}`,
                        text: `${season + parseInt(stateState.league_season)} ${season === 0 ? `${round + 1}.${(order + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 })}` : ` Round ${round + 1}`}`,
                        image: {
                            src: null,
                            alt: 'pick headshot',
                            type: 'player'
                        }
                    })
                })
            }
        })
    })


    const players_list = [
        ...Array.from(
            new Set(
                user.leagues.map(league => league.rosters?.map(roster => roster.players)).flat(3)
            )
        ).map(player_id => {
            return {
                id: player_id,
                text: allPlayers[player_id]?.full_name,
                image: {
                    src: player_id,
                    alt: 'player headshot',
                    type: 'player'
                }
            }
        }),
        ...picks_list
    ]

    const managers_list = []

    user.leagues
        .forEach(league => {
            league.rosters
                .filter(r => parseInt(r.user_id) > 0)
                .forEach(roster => {
                    if (!managers_list.find(m => m.id === roster.user_id)) {
                        managers_list.push({
                            id: roster.user_id,
                            text: roster.username,
                            image: {
                                src: roster.avatar,
                                alt: 'user avatar',
                                type: 'user'
                            }
                        })
                    }
                })
        })




    let searchBar;

    switch (tab) {
        case 'Leaguemate Trades':
            searchBar = (
                <>
                    <Search
                        id={'By Player'}
                        placeholder={`Player`}
                        list={players_list}
                        tab={tab}
                        searched={searched_player}
                        setSearched={setSearched_Player}
                    />
                    <Search
                        id={'By Manager'}
                        sendSearched={(data) => setSearched_Manager(data)}
                        placeholder={`Manager`}
                        list={managers_list}
                        tab={tab}
                    />




                </>
            )
            break;
        case 'Leaguemate Leagues Trades':
            searchBar = <Search
                id={'By Manager'}
                placeholder={`Leaguemate`}
                list={[]}
                tab={tab}
                searched={searched_manager}
                setSearched={setSearched_Manager}
            />
            break;
        case 'Price Check':
            searchBar = (
                <>
                    <Search
                        id={'By Player'}
                        sendSearched={(data) => setPricecheck_player(data)}
                        placeholder={`Player`}
                        list={players_list}
                        tab={tab}
                    />
                    {
                        pricecheck_player === '' ? null :
                            <>
                                <Search
                                    id={'By Player'}
                                    sendSearched={(data) => setPricecheck_player2(data)}
                                    placeholder={`Player`}
                                    list={players_list}
                                    tab={tab}
                                />
                            </>
                    }
                </>
            )

            break;
        default:
            break;

    }

    const loadMore = async () => {
        console.log('LOADING MORE')
        if (tab === 'Leaguemate Trades') {
            if (searched_player === '' && searched_manager === '') {


                dispatch(fetchLmTrades(user.user_id, user.leagues, stateState.league_season, lmTrades.trades.length, 125))

            } else {
                setPage(Math.ceil(tradesDisplay.length / 25) + 1)

                dispatch(fetchFilteredLmTrades(searched_player.id, searched_manager.id, stateState.league_season, tradesDisplay.length, 125))

            }
        } else if (tab === 'Price Check') {




            dispatch(fetchPriceCheckTrades(pricecheck_player.id, pricecheck_player2.id, tradesDisplay.length, 125))

        }

    }

    return <>
        <h2>
            {tradeCount?.toLocaleString("en-US")}
            {` ${stateState.league_season} Trades`}

        </h2>
        <div className='navbar'>
            <p className='select'>
                {tab}&nbsp;<i class="fa-solid fa-caret-down"></i>
            </p>

            <select
                className='trades'
                onChange={(e) => setTab(e.target.value)}
                value={tab}

            >
                <option>Price Check </option>
                <option>Leaguemate Trades</option>
            </select>
        </div>
        <div className="trade_search_wrapper">

            {searchBar}
        </div>
        {
            (isLoadingLmTrades || isLoadingFilteredLmTrades || isLoadingPricecheckTrades) ?
                <div className='loading_wrapper'>
                    {loadingIcon}
                </div>
                :
                <TableMain
                    id={'trades'}
                    type={'primary'}
                    headers={trades_headers}
                    body={trades_body}
                    itemActive={itemActive}
                    setItemActive={setItemActive}
                    page={page}
                    setPage={setPage}
                    partial={tradesDisplay?.length < tradeCount ? true : false}
                    loadMore={loadMore}
                    isLoading={isLoadingLmTrades}
                />
        }
    </>
}

export default Trades;