const path = require('path');
const fs = require('fs');
const log = require('./log');
const readFiles = require('./readFiles');
const {extractDependencies} = require('./dependencies');
const {resolveBasePath, toCamelCasePath} = require('./helpers/fs');

const shouldDisableCamelCase = (predict, path) => {
  return (
    (typeof predict === 'boolean' && predict) || (predict && predict.test(path))
  );
};

module.exports = (rules, aliases, resolveFile, dryrun) => {
  const processedFiles = new Set();
  return rules.reduce((all, rule) => {
    const {from} = rule;
    const toBase = rule.to;
    const files = readFiles(from);
    log.infoIf(dryrun && !files.length, `no matched files: ${from}`);

    const baseFrom = resolveBasePath(from);
    const mappings = files
      .filter(file => !processedFiles.has(file))
      .map(file => {
        processedFiles.add(file);
        const format = path.extname(file);
        const isJs = format === '.js';
        const name = path.basename(file);
        let relativeFrom = file.substring(baseFrom.length);

        const resolvedFile = resolveFile ? resolveFile(relativeFrom) : false;

        if (
          typeof resolvedFile !== 'string' &&
          (typeof resolvedFile !== 'boolean' || resolvedFile !== false)
        ) {
          log.fatal(
            `'resolveFile' should return false or path (string). ${resolvedFile} given`
          );
        }

        if (resolvedFile === false) {
          const disableCamelCase = shouldDisableCamelCase(
            rule.disableCamelCase,
            file
          );
          if (!disableCamelCase) {
            const transformedPath = isJs
              ? relativeFrom
              : path.dirname(relativeFrom);
            relativeFrom = toCamelCasePath(transformedPath);
            relativeFrom = isJs ? relativeFrom : path.join(relativeFrom, name);
          }
        } else {
          relativeFrom = resolvedFile;
        }

        const to = toBase.endsWith(relativeFrom)
          ? toBase
          : path.join(toBase, relativeFrom);
        const content = isJs ? fs.readFileSync(file, 'utf8') : null;
        const dependencies = isJs
          ? extractDependencies(content, file, aliases)
          : null;

        return {
          from,
          baseFrom,
          to,
          toBase,
          file,
          content,
          dependencies,
          format,
          name
        };
      });
    return all.concat(mappings);
  }, []);
};
