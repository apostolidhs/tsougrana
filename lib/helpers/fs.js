const fs = require('fs');
const path = require('path');

const toCamelCase = str => {
  let match;
  while ((match = str.match(/\S_\S/))) {
    str =
      str.substring(0, match.index + 1) +
      str[match.index + 2].toUpperCase() +
      str.substring(match.index + 3);
  }
  return str;
};

const toCamelCasePath = path => {
  return path
    .split('/')
    .map(t => t && toCamelCase(t))
    .join('/');
};

const resolveBasePath = pathPattern => {
  const index = pathPattern.lastIndexOf(path.sep);
  const parentPath = pathPattern.substring(0, index);
  return fs.existsSync(parentPath) ? parentPath : resolveBasePath(parentPath);
};

const mkdirp = filePath => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  mkdirp(dirname);
  fs.mkdirSync(dirname);
};

module.exports = {resolveBasePath, mkdirp, toCamelCasePath};
