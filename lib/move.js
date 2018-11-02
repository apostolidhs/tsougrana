const path = require('path');
const fs = require('fs');
const patterns = require('./patterns');
const log = require('./log');
const getConfig = require('./getConfig');
const readFiles = require('./readFiles');

const mkdirp = filePath => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  mkdirp(dirname);
  fs.mkdirSync(dirname);
}

const resolveBasePath = pathPattern => {
  const index = pathPattern.lastIndexOf(path.sep);
  const parentPath = pathPattern.substring(0, index);
  return fs.existsSync(parentPath) ? parentPath : resolveBasePath(parentPath);
};

const extractDependencies = (content, file, aliases) => {
  const deps = patterns.matchDependencies(content);
  return deps.map(dep => {
    const {name} = dep;
    const alias = Object.keys(aliases).find(a => name.startsWith(a));
    const isAlias = !!alias;
    const aliasTo = alias && aliases[alias];
    const isInternal = !isAlias && name.startsWith('.');
    const isExternal = !isInternal;

    let resolvesTo;
    if (isAlias) {
      resolvesTo = name.replace(alias, aliasTo);
    } else if (isInternal) {
      const dir = path.dirname(file);
      resolvesTo = path.join(dir, name);
    } else {
      resolvesTo = name;
    }

    return {
      dep,
      alias,
      aliasTo,
      resolvesTo,
      isAlias,
      isInternal,
      isExternal
    };
  });
};

const getMappingFiles = (rules, aliases) => {
  return rules.reduce((all, rule) => {
    const {from} = rule;
    const toBase = rule.to;
    const files = readFiles(from);
    const baseFrom = resolveBasePath(from);
    const mappings = files.map(file => {
      const relativeFrom = file.substring(baseFrom.length);
      const to = path.join(toBase, relativeFrom);
      const content = fs.readFileSync(file, 'utf8');
      const dependencies = extractDependencies(content, file, aliases);

      return {
        from,
        baseFrom,
        to,
        toBase,
        file,
        content,
        dependencies
      };
    });
    return all.concat(mappings);
  }, []);
};

const tranformDestinationAlias = (resolvesTo, destinationAliases) => {
  const destinationAlias = Object.keys(destinationAliases).find(alias => {
    return resolvesTo.startsWith(destinationAliases[alias]);
  });

  return destinationAlias
    ? resolvesTo.replace(destinationAliases[destinationAlias], destinationAlias)
    : null;
};

const resolveDependencies = (mappingFiles, mappingFile, destinationAliases) => {
  return mappingFile.dependencies.reduce((all, dependency) => {
    let resolvesTo = tranformDestinationAlias(
      dependency.resolvesTo,
      destinationAliases
    );
    if (resolvesTo) {
      return all.concat([{...dependency.dep, resolvesTo}]);
    }

    const resolvesToMappingFile = mappingFiles.find(f => {
      if (f.file === dependency.resolvesTo) {
        return true;
      }
      return f.file.replace(/\/index.js$/, '') === dependency.resolvesTo;
    });

    if (resolvesToMappingFile) {
      resolvesTo = tranformDestinationAlias(
        resolvesToMappingFile.to,
        destinationAliases
      );
      if (resolvesTo) {
        return all.concat([{...dependency.dep, resolvesTo}]);
      }

      resolvesTo = path.relative(mappingFile.to, resolvesToMappingFile.to);
      return all.concat([{...dependency.dep, resolvesTo}]);
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

    const resolutions = resolveDependencies(
      mappingFiles,
      mappingFile,
      destinationAliases
    );
    if (resolutions.length) {
      const resolvedContent = resolveContent(mappingFile, resolutions);
      fs.writeFileSync(mappingFile.to, resolvedContent);
      return;
    }

    fs.copyFileSync(mappingFile.file, mappingFile.to);
  });
};

module.exports = configPath => {
  const now = Date.now();
  log.info('tsougrana started...');

  const config = getConfig(configPath);
  const mappingFiles = getMappingFiles(config.rules, config.aliasFrom);
  resolveMappingFiles(mappingFiles, config.aliasTo);

  log.info(`tsougrana finished in ${Date.now() - now}ms`);
  process.exit(0);
};
