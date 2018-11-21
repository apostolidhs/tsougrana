const path = require('path');
const fs = require('fs');
const log = require('./log');
const getConfig = require('./getConfig');
const getMappingFiles = require('./getMappingFiles');
const getResolvesTo = require('./getResolvesTo');
const {mkdirp} = require('./helpers/fs');

const tranformDestinationAlias = (resolvesTo, destinationAliases) => {
  const destinationAlias = destinationAliases.find(a =>
    resolvesTo.startsWith(a.to)
  );

  return destinationAlias
    ? resolvesTo.replace(destinationAlias.to, destinationAlias.from)
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

const resolveDependencies = args => {
  const {
    mappingFiles,
    mappingFile,
    destinationAliases,
    toBase,
    relativeResolutionDepth,
    dryrun
  } = args;
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
      resolvesTo = tranformDestinationAlias(
        resolvesToMappingFile.to,
        destinationAliases
      );
      return addNormalizedDep(
        all,
        dependency,
        getResolvesTo({
          file: mappingFile.to,
          depFile: resolvesToMappingFile.to,
          resolvesTo,
          base: toBase,
          relativeResolutionDepth
        })
      );
    }

    log.infoIf(
      dryrun && !dependency.isExternal,
      `${dependency.dep.name} -> ${mappingFile.file}`
    );

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

const logMove = (mappingFile, dryrun) =>
  log.info(`${mappingFile.to} -> ${mappingFile.to}`, dryrun ? 0 : 1);

const resolveMappingFiles = (
  mappingFiles,
  destinationAliases,
  toBase,
  relativeResolutionDepth,
  options
) => {
  const {dryrun, ignoreFiles} = options;
  log.infoIf(dryrun, 'missing');
  mappingFiles.forEach(mappingFile => {
    if (ignoreFiles && ignoreFiles.test(mappingFile.file)) {
      return;
    }

    mkdirp(mappingFile.to);

    if (mappingFile.format === '.js') {
      const resolutions = resolveDependencies({
        mappingFiles,
        mappingFile,
        destinationAliases,
        toBase,
        relativeResolutionDepth,
        dryrun
      });
      if (resolutions.length) {
        const resolvedContent = resolveContent(mappingFile, resolutions);
        logMove(mappingFile, dryrun);
        if (!dryrun) {
          fs.writeFileSync(mappingFile.to, resolvedContent);
        }
        return;
      }
    }

    logMove(mappingFile, dryrun);
    if (!dryrun) {
      fs.copyFileSync(mappingFile.file, mappingFile.to);
    }
  });
};

module.exports = (configPath, options = {}) => {
  const {verbose, dryrun} = options;
  const now = Date.now();
  log.setVerbose(verbose);
  log.info('tsougrana started...');

  const config = getConfig(configPath, options);
  const {
    rules,
    aliasFrom,
    aliasTo,
    ignoreFiles,
    toBase,
    relativeResolutionDepth,
    resolveFile
  } = config;

  log.info('gathering files', 1);
  const mappingFiles = getMappingFiles(rules, aliasFrom, resolveFile, dryrun);
  log.info(`gethered ${mappingFiles.length} files`, 1);

  log.info('resolving', 1);
  resolveMappingFiles(mappingFiles, aliasTo, toBase, relativeResolutionDepth, {
    dryrun,
    ignoreFiles
  });

  log.info(`tsougrana finished in ${Date.now() - now}ms`);
  process.exit(0);
};
