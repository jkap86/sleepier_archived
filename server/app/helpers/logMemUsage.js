
const logMemUsage = (req, res, next) => {
    const used = process.memoryUsage()

    for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }

    next()
}

module.exports = {
    logMemUsage: logMemUsage
}