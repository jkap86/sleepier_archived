module.exports = async (home_cache) => {
    const fs = require('fs');
    const ALLPLAYERS = require('../../allplayers.json');

    const getAllPlayers = async () => {
        //  get allplayers dict - from .json file in dev; filter for active and position

        let sleeper_players;
        if (process.env.DATABASE_URL) {
            try {
                sleeper_players = await axios.get('https://api.sleeper.app/v1/players/nfl')

                sleeper_players = Object.fromEntries(Object.keys(sleeper_players.data)
                    .filter(player_id => sleeper_players.data[player_id].active && ['QB', 'RB', 'FB', 'WR', 'TE', 'K'].includes(sleeper_players.data[player_id].position))
                    .map(key => {
                        const { position, college, number, birth_date, age, full_name, active, team, player_id, search_full_name } = sleeper_players.data[key];
                        return [
                            key,
                            {
                                position,
                                college,
                                number,
                                birth_date,
                                age,
                                full_name,
                                active,
                                team,
                                player_id,
                                search_full_name
                            }
                        ]
                    }
                    ))

                fs.writeFileSync('./allplayers.json', JSON.stringify(sleeper_players))

            } catch (error) {
                console.log(error)
            }
        } else {
            console.log('getting allplayers from file...')

            sleeper_players = ALLPLAYERS
        }
    }

    //  set delay so interval is at 3am eastern 
    const axios = require('../api/axiosInstance')
    const date = new Date()
    const date_tz = new Date(date.toLocaleDateString('en-US', { timeZone: 'America/New_York' }))
    const hour = date_tz.getHours()
    const minute = date_tz.getMinutes()

    let delay;
    if (hour < 3) {
        delay = (((3 - hour) * 60) + (60 - minute)) * 60 * 1000
    } else {
        delay = (((27 - hour) * 60) + (60 - minute)) * 60 * 1000
    }

    const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
    home_cache.set('state', {
        ...state.data,
        display_week: Math.max(state.data.display_week, 1)
    }, 0)

    const allplayers = await getAllPlayers()
    home_cache.set('allplayers', allplayers, 0)

    const nflschedule = await axios.get(`https://api.myfantasyleague.com/2023/export?TYPE=nflSchedule&W=ALL&JSON=1`)

    const schedule = {}

    nflschedule.data.fullNflSchedule.nflSchedule.map(matchups_week => {
        return schedule[matchups_week.week] = matchups_week.matchup
    })

    if (process.env.DATABASE_URL) {
        fs.writeFileSync('./schedule.json', JSON.stringify(schedule))
    }

    setTimeout(async () => {
        setInterval(async () => {
            //  update state and allplayers dict every 24 hrs
            const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
            home_cache.set('state', {
                ...state.data,
                display_week: Math.max(state.data.display_week, 1)
            }, 0)

            const allplayers = await getAllPlayers()
            home_cache.set('allplayers', allplayers, 0)

        }, 24 * 60 * 60 * 1 * 1000)
    }, delay)

    console.log('Server Boot Complete...')
    return


}

