import { getPlayerScore } from "./getPlayerScore"
import { matchTeam } from "./misc"

export const getLineupCheck = (matchup, league, stateAllPlayers, weeklyRankings, projections, schedule, includeTaxi, includeLocked) => {

    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
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
    const starting_slots = league.roster_positions.filter(x => Object.keys(position_map).includes(x))

    const roster = league.rosters.find(r => r.roster_id === matchup.roster_id)

    let players = []

    matchup?.players
        ?.filter(player_id => includeTaxi ? true : !(roster?.taxi || []).includes(player_id))
        ?.map(player_id => {
            const playing = schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[player_id]?.team) || !stateAllPlayers[player_id]?.team)
            players.push({
                id: player_id,
                rank: weeklyRankings
                    ? !playing
                        ? 1001
                        : weeklyRankings[player_id]?.prevRank
                            ? matchup.starters?.includes(player_id)
                                ? weeklyRankings[player_id]?.prevRank
                                : weeklyRankings[player_id]?.prevRank + 1
                            : matchup.starters?.includes(player_id)
                                ? 999
                                : 1000
                    : getPlayerScore([projections[player_id]], league.scoring_settings, true) || 0
            })
        })

    const getOptimalLineup = () => {
        let optimal_lineup = []
        let player_ranks_filtered = players
        starting_slots.map((slot, index) => {
            const kickoff = new Date(parseInt(schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === (stateAllPlayers[matchup.starters?.[index]]?.team)))
                ?.kickoff * 1000)).getTime()

            const slot_options = player_ranks_filtered
                .filter(x =>
                    position_map[slot].includes(stateAllPlayers[x.id]?.position)
                )
                .sort(
                    (a, b) => weeklyRankings ? a.rank - b.rank : b.rank - a.rank
                )

            const optimal_player = includeLocked && kickoff > new Date().getTime() ? matchup.starters[index] : slot_options[0]?.id

            player_ranks_filtered = player_ranks_filtered.filter(x => x.id !== optimal_player)
            optimal_lineup.push({
                slot: position_abbrev[slot],
                player: optimal_player
            })
        })

        return optimal_lineup
    }

    let optimal_lineup = matchup ? getOptimalLineup() : []

    const findSuboptimal = () => {
        let lineup_check = []
        starting_slots.map((slot, index) => {
            const cur_id = (matchup?.starters || [])[index]
            const isInOptimal = optimal_lineup.find(x => x.player === cur_id)
            const kickoff = new Date(parseInt(schedule
                ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[cur_id]?.team))
                ?.kickoff * 1000))
            const gametime = new Date(kickoff)
            const day = gametime.getDay() <= 2 ? gametime.getDay() + 7 : gametime.getDay()
            const hour = gametime.getHours()
            const timeslot = parseFloat(day + '.' + hour)
            const slot_options = matchup?.players
                ?.filter(x =>
                    !(matchup.starters || []).includes(x) &&
                    position_map[slot].includes(stateAllPlayers[x]?.position)
                )
                || []
            const earlyInFlex = matchup.starters?.find((x, starter_index) => {
                const alt_kickoff = new Date(parseInt(schedule
                    ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[x]?.team))
                    ?.kickoff * 1000))
                const alt_gametime = new Date(alt_kickoff)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return timeslot < 7
                    && alt_timeslot > timeslot

                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length < position_map[slot].length


            })

            const lateNotInFlex = matchup.starters?.find((x, starter_index) => {
                const alt_kickoff = new Date(parseInt(schedule
                    ?.find(matchup => matchup.team.find(t => matchTeam(t.id) === stateAllPlayers[x]?.team))
                    ?.kickoff * 1000))
                const alt_gametime = new Date(alt_kickoff)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return (
                    timeslot > 7.17
                    && alt_timeslot < timeslot

                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length > position_map[slot].length

                )
            })

            return lineup_check.push({
                index: index,
                slot: position_abbrev[slot] || 'IDP',
                slot_index: `${position_abbrev[slot]}_${index}`,
                current_player: (matchup?.starters || [])[index] || '0',
                notInOptimal: !isInOptimal,
                earlyInFlex: earlyInFlex,
                lateNotInFlex: lateNotInFlex,
                nonQBinSF: position_map[slot].includes('QB') && stateAllPlayers[(matchup?.starters || [])[index]]?.position !== 'QB',
                slot_options: slot_options,
                player: stateAllPlayers[matchup?.starters[index]]?.full_name,
                timeslot: timeslot

            })
        })
        return lineup_check
    }

    const lineup_check = matchup ? findSuboptimal() : []

    return {
        players_points: matchup.players_points,
        players_projections: Object.fromEntries(players.map(player => [player.id, parseFloat(player.rank)])),
        starting_slots: starting_slots,
        optimal_lineup: optimal_lineup,
        lineup_check: lineup_check
    }
}