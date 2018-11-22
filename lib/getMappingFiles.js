const path = require('path');
const fs = require('fs');
const log = require('./log');
const readFiles = require('./readFiles');
const {extractDependencies} = require('./dependencies');
const {cameCaseJs} = require('./renameStrategy');
const {resolveBasePath} = require('./helpers/fs');

const shouldDisableCamelCase = (predict, path) => {
  return (
    (typeof predict === 'boolean' && predict) || (predict && predict.test(path))
  );
};

const getFilenameFormConfig = (resolveFile, file) => {
  const resolvedFile = resolveFile ? resolveFile(file) : false;

  if (
    typeof resolvedFile !== 'string' &&
    (typeof resolvedFile !== 'boolean' || resolvedFile !== false)
  ) {
    log.fatal(
      `'resolveFile' should return false or path (string). ${resolvedFile} given`
    );
  }

  return resolvedFile;
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
        const dirname = path.dirname(relativeFrom);
        const resolvedFile = getFilenameFormConfig(resolveFile, relativeFrom);

        if (resolvedFile === false) {
          const disableCamelCase = shouldDisableCamelCase(
            rule.disableCamelCase,
            file
          );
          if (!disableCamelCase) {
            relativeFrom = cameCaseJs(relativeFrom, dirname, name, format);
          }
        } else {
          relativeFrom = resolvedFile;
        }

        const to = toBase.endsWith(relativeFrom)
          ? toBase
          : path.join(toBase, relativeFrom);
        // const to = path.join(toBase, relativeFrom);
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
