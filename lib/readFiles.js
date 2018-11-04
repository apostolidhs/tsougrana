const fs = require('fs');
const glob = require('glob');
const log = require('./log');

const readNestedFiled = pattern => {
  const paths = glob.sync(pattern, {stat: true, dot: true});
  return paths.reduce((all, path) => {
    if (!fs.existsSync(path)) {
      log.fatal(`cannot find path '${path}'`);
    }

    const nestedFiles = fs.statSync(path).isDirectory()
      ? []
      : [path];

    return all.concat(nestedFiles);
  }, []);
};

const readFile = pattern => {
  const paths = glob.sync(pattern, {stat: true, dot: true});
  return paths.reduce((all, path) => {
    if (!fs.existsSync(path)) {
      log.fatal(`cannot find path '${path}'`);
    }

    const nestedFiles = fs.statSync(path).isDirectory()
      ? readNestedFiled(path + '/**')
      : [path];

    return all.concat(nestedFiles);
  }, []);
};

module.exports = readFile;
