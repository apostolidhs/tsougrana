const path = require('path');
const fs = require('fs');
const readFiles = require('./readFiles');
const {extractDependencies} = require('./dependencies');
const {resolveBasePath, toCamelCasePath} = require('./helpers/fs');

module.exports = (rules, aliases) => {
  const processedFiles = new Set();
  return rules.reduce((all, rule) => {
    const {from} = rule;
    const toBase = rule.to;
    const files = readFiles(from);
    const baseFrom = resolveBasePath(from);
    const mappings = files
      .filter(file => !processedFiles.has(file))
      .map(file => {
        processedFiles.add(file);
        const format = path.extname(file);
        const name = path.basename(file);
        let relativeFrom = file.substring(baseFrom.length);
        if (!rule.disableCamelCase) {
          const tranformedPath = format
            ? relativeFrom
            : path.dirname(relativeFrom);
          relativeFrom = toCamelCasePath(tranformedPath);
          relativeFrom = format ? relativeFrom : path.join(relativeFrom, name);
        }
        const to = toBase.endsWith(relativeFrom)
          ? toBase
          : path.join(toBase, relativeFrom);
        const content = format ? fs.readFileSync(file, 'utf8') : null;
        const dependencies = format
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
