const log = (...args) => console.log(new Date().toISOString(), ...args);
const err = (...args) => console.error(new Date().toISOString(), ...args);
module.exports = { log, err };
