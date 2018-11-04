const path = require('path');
const fs = require('fs');
const log = require('./log');
const getConfig = require('./getConfig');
const getMappingFiles = require('./getMappingFiles');
const {mkdirp} = require('./helpers/fs');

const tranformDestinationAlias = (resolvesTo, destinationAliases) => {
  const destinationAlias = Object.keys(destinationAliases).find(alias => {
    return resolvesTo.startsWith(destinationAliases[alias]);
  });

  return destinationAlias
    ? resolvesTo.replace(destinationAliases[destinationAlias], destinationAlias)
    : null;
};

const addNormalizedDep = (buffer, dependency, resolvesTo) => {
  resolvesTo = resolvesTo
    .replace(/\/index.js$/, '')
    .replace(/\.js$/, '')
    .replace(/^\.$/, './index');
  buffer.push({...dependency.dep, resolvesTo});
  return buffer;
};

const resolveDependencies = (mappingFiles, mappingFile, destinationAliases) => {
  return mappingFile.dependencies.reduce((all, dependency) => {
    const resolvesToMappingFile = mappingFiles.find(f => {
      if (f.file === dependency.resolvesTo) {
        return true;
      }
      return (
        f.file.replace(/\.js$/, '') === dependency.resolvesTo ||
        f.file.replace(/\/index.js$/, '') === dependency.resolvesTo
      );
    });

    if (resolvesToMappingFile) {
      resolvesTo =
        !dependency.isInternal &&
        tranformDestinationAlias(resolvesToMappingFile.to, destinationAliases);
      if (resolvesTo) {
        return addNormalizedDep(all, dependency, resolvesTo);
      }

      resolvesTo = path.relative(
        mappingFile.to,
        resolvesToMappingFile.to.replace(/\/index.js$/, '').replace(/\.js$/, '')
      );

      // path.relative always adds a backward step
      // ../../bar => ../bar | ../bar => ./bar
      const subIndex = resolvesTo.match(/^\.\.\/\.\.\//) ? 3 : 1;
      resolvesTo = resolvesTo.substring(subIndex);

      return addNormalizedDep(all, dependency, resolvesTo);
    }

    return all;
  }, []);
};

const resolveContent = (mappingFile, resolutions) => {
  if (!resolutions.length) {
    return;
  }

  const {content} = mappingFile;
  let cursor = 0;
  const contentBuffer = resolutions.reduce((buffer, resolution) => {
    buffer.push(content.substring(cursor, resolution.pos.from));
    buffer.push(resolution.resolvesTo);
    cursor = resolution.pos.to;

    return buffer;
  }, []);

  contentBuffer.push(content.substring(cursor));

  return contentBuffer.join('');
};

const resolveMappingFiles = (mappingFiles, destinationAliases) => {
  mappingFiles.forEach(mappingFile => {
    mkdirp(mappingFile.to);

    if (mappingFile.format === '.js') {
      const resolutions = resolveDependencies(
        mappingFiles,
        mappingFile,
        destinationAliases
      );
      if (resolutions.length) {
        const resolvedContent = resolveContent(mappingFile, resolutions);
        log.info(`copy and modify ${mappingFile.to}\nto ${mappingFile.to}`, 1);
        fs.writeFileSync(mappingFile.to, resolvedContent);
        return;
      }
    }

    log.info(`copy ${mappingFile.file}\nto ${mappingFile.to}`, 1);
    fs.copyFileSync(mappingFile.file, mappingFile.to);
  });
};

module.exports = (configPath, options = {}) => {
  const {verbose} = options;
  const now = Date.now();
  log.setVerbose(verbose);
  log.info('tsougrana started...');

  const config = getConfig(configPath);
  const {rules, fromBase, aliasFrom} = config;

  log.info('gathering files', 1);
  const mappingFiles = getMappingFiles(rules, fromBase, aliasFrom);
  log.info(`gethered ${mappingFiles.length} files`, 1);

  log.info('resolving', 1);
  resolveMappingFiles(mappingFiles, config.aliasTo);

  log.info(`tsougrana finished in ${Date.now() - now}ms`);
  process.exit(0);
};
