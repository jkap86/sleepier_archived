import TableMain from "../Home/tableMain"
import { useSelector } from 'react-redux';

const Standings = ({
    league_id,
    getAttribute,
    rosters
}) => {
    const { projectionDict } = useSelector(state => state.main);
    const { rankings, includeTaxi, includeLocked, week, recordType } = useSelector(state => state.lineups)

    console.log(rosters)
    const hash = `${includeTaxi}-${includeLocked}`;

    const headers = [
        [
            {
                text: 'Manager',
                colSpan: 7
            },
            {
                text: 'Record',
                colSpan: 3
            },
            {
                text: 'PF',
                colSpan: 4
            },
            {
                text: 'PA',
                colSpan: 4
            }
        ]]

    const body = Object.keys(projectionDict[hash]?.['1']?.[league_id] || {})
        .sort((a, b) => getAttribute('wins', b) - getAttribute('wins', a) || getAttribute('fpts', b) - getAttribute('fpts', a))
        .map(roster_id => {
            const wins = getAttribute('wins', roster_id)
            const losses = getAttribute('losses', roster_id)
            const ties = getAttribute('ties', roster_id)
            const fpts = getAttribute('fpts', roster_id)
            const fpts_against = getAttribute('fpts_against', roster_id)

            const manager_roster = rosters.find(r => r.roster_id === parseInt(roster_id))

            return {
                id: roster_id,
                search: {
                    text: manager_roster?.username || 'Orphan',
                    image: {
                        src: manager_roster?.avatar,
                        alt: manager_roster?.name,
                        type: 'user'
                    }
                },
                list: [
                    {
                        text: manager_roster?.username || 'Orphan',
                        colSpan: 7,
                        className: 'left',
                        image: {
                            src: manager_roster?.avatar,
                            alt: manager_roster?.name,
                            type: 'user'
                        }
                    },
                    {
                        text: wins + '-' + losses + (ties > 0 ? `-${ties}` : ''),
                        colSpan: 3
                    },
                    {
                        text: fpts.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
                        colSpan: 4
                    },
                    {
                        text: fpts_against.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
                        colSpan: 4
                    }
                ]
            }
        })

    return <>
        <TableMain
            type={'secondary'}
            headers={headers}
            body={body}
        />
    </>
}

export default Standings;