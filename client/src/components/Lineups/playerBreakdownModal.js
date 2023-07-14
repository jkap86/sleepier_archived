import { useSelector, useDispatch } from "react-redux";
import { avatar } from "../Home/functions/misc";
import { setState } from "../../actions/actions";
import { forwardRef, useMemo, useState } from "react";

const PlayerBreakdownModal = forwardRef(({
    player_id
}, ref) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.user);
    const { allPlayers, projections } = useSelector(state => state.main);
    const [projectionEdits, setProjectionEdits] = useState({})

    const stat_categories = useMemo(() => {
        return Array.from(
            new Set(user.leagues
                .flatMap(league =>
                    Object.keys(league.scoring_settings || {})
                        .filter(
                            setting => (
                                setting.startsWith('pass')
                                || setting.startsWith('rush')
                                || setting.startsWith('rec')
                                || setting.startsWith('bonus')
                                || setting.startsWith('fum ')
                            )
                        )
                )
            )
        )
            .sort((a, b) => {
                const value1 = a.startsWith('pass') ? 1 : a.startsWith('rush') ? 2 : a.startsWith('rec') ? 3 : 4;
                const value2 = b.startsWith('pass') ? 1 : b.startsWith('rush') ? 2 : b.startsWith('rec') ? 3 : 4;

                if (value1 !== value2) {
                    return value1 - value2
                } else {
                    return b.localeCompare(a);
                }
            })
    }, [user.leagues])

    return <div className="modal">
        <div className="modal-grid" ref={ref}>
            <button className="close" onClick={(e) => {
                e.stopPropagation()
                dispatch(setState({
                    projections: {
                        ...projections,
                        [player_id]: {
                            stats: {
                                ...projections[player_id].stats,
                                ...projectionEdits
                            }
                        }
                    }
                }, 'MAIN'))
                dispatch(setState({ playerBreakdownModal: false }, 'LINEUPS'))
            }}>X</button>
            <table className="modal">
                <caption>
                    <strong>
                        {avatar(player_id, 'player', 'player')}
                        {allPlayers[player_id]?.full_name}
                    </strong>
                </caption>
                <thead>
                    <tr>
                        <th colSpan={2}>
                            Scoring Setting
                        </th>
                        <th>
                            Stats
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        stat_categories
                            .filter(category => projections[player_id].stats[category])
                            .map(category =>
                                <tr key={category}>
                                    <td colSpan={2}>
                                        {category.replace(/_/g, ' ')}
                                    </td>
                                    <td>
                                        <input
                                            className="editRank"
                                            defaultValue={projections[player_id].stats[category]}
                                            onChange={(e) => setProjectionEdits(prevState => {
                                                return {
                                                    ...prevState,
                                                    [category]: parseFloat(e.target.value)
                                                }
                                            })}
                                        />
                                    </td>
                                </tr>
                            )
                    }
                </tbody>
            </table>
        </div>
    </div>
})

export default PlayerBreakdownModal;