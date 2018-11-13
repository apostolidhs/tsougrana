const verboseLevels = {
  light: 0,
  heavy: 1
};

let verbose = verboseLevels.light;

const info = (msg, verboseLevel = 0) =>
  verboseLevel <= verbose ? console.info(msg) : undefined;

const infoIf = (cond, msg) => cond && console.info(msg);

const error = msg => console.error(msg);

const fatal = msg => {
  error(msg);
  process.exit(1);
};

const setVerbose = v => (verbose = verboseLevels[v] || verboseLevels.light);

module.exports = {
  error,
  fatal,
  info,
  infoIf,
  verboseLevels,
  setVerbose
};
