const fs = require('fs');
const log = require('./log');
const patterns = require('./patterns');
const readFiles = require('./readFiles');

const getDependencies = (pathPattern, ignoreEmpty) => {
  const files = readFiles(pathPattern);
  return files.reduce((all, file) => {
    const content = fs.readFileSync(file, 'utf8');
    const dependencies = patterns.matchDependencies(content);
    if (!ignoreEmpty || dependencies.length) {
      all[file] = dependencies;
    }
    return all;
  }, {});
};

const getExternalDependenciesForFiles = dependenciesPerFile => {
  return Object.keys(dependenciesPerFile).reduce((all, file) => {
    all[file] = dependenciesPerFile[file].filter(d => !d.name.startsWith('.'));
    return all;
  }, {});
};

const printJSON = dependenciesPerFile => {
  log.info(JSON.stringify(dependenciesPerFile, 0, 2));
};

const printRaw = dependenciesPerFile => {
  Object.keys(dependenciesPerFile).forEach(file => {
    log.info('===');
    log.info(file);
    log.info('---');
    log.info(dependenciesPerFile[file].map(d => d.name).join('\n'));
  });
};

const printOnlyDependencies = dependenciesPerFile => {
  const allDependencies = Object.keys(dependenciesPerFile).reduce(
    (all, file) => {
      return all.concat(dependenciesPerFile[file].map(d => d.name));
    },
    []
  );
  const dependencies = Array.from(new Set(allDependencies)).sort();
  log.info(dependencies.join('\n'));
};

const print = (dependenciesPerFile, printFormat) => {
  if (printFormat === 'raw') {
    printRaw(dependenciesPerFile);
  } else if (printFormat === 'onlyDependencies') {
    printOnlyDependencies(dependenciesPerFile);
  } else {
    printJSON(dependenciesPerFile);
  }
};

const printDependencies = (pathPattern, options = {}) => {
  const {printFormat, ignoreEmpty, onlyExternal} = options;
  const dependencies = getDependencies(pathPattern, ignoreEmpty);

  const dependenciesPerFile = onlyExternal
    ? getExternalDependenciesForFiles(dependencies)
    : dependencies;

  print(dependenciesPerFile, printFormat);
};

module.exports = {getDependencies, printDependencies};
