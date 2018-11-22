const path = require('path');
const {toCamelCasePath} = require('./helpers/fs');

const cameCasePath = (file, dirname, name, format) => {
  return toCamelCasePath(file);
};

const cameCaseDirectory = (file, dirname, name, format) => {
  const camelCaseDirname = toCamelCasePath(dirname);
  return path.join(camelCaseDirname, name);
};

const cameCaseJs = (file, dirname, name, format) => {
  return format === '.js'
    ? cameCasePath(file, dirname, name, format)
    : cameCaseDirectory(file, dirname, name, format);
};

module.exports = {cameCaseJs, cameCaseDirectory, cameCasePath};
