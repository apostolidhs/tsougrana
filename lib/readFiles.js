const fs = require('fs');
const glob = require('glob');
const log = require('./log');

const readFile = pattern => {
  const files = glob.sync(pattern, {stat: true, nodir: true, dot: true});
  if (files.length) {
    return files;
  }

  if (!fs.existsSync(pattern)) {
    log.fatal(`cannot find path '${pattern}'`);
  }

  return fs.statSync(pattern).isDirectory()
    ? readFile(pattern + '/**')
    : [pattern];
};

module.exports = readFile;
