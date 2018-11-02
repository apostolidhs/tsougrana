const info = msg => console.info(msg);

const error = msg => console.error(msg);

const fatal = msg => {
  error(msg);
  process.exit(1);
};

module.exports = {
  error,
  fatal,
  info
};
