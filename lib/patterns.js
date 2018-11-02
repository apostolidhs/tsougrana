const requireFile = /require\s*\(\s*('|")(\S+)('|")\s*\)/;

const importFile = /import\s*('|")(\S+)('|")/;

const importSegment = /import.*from\s*('|")(\S+)('|")/;

const requireFileG = new RegExp(requireFile.source, 'g');

const importFileG = new RegExp(importFile.source, 'g');

const importSegmentG = new RegExp(importSegment.source, 'g');

const createDependency = (file, match) => {
  const name = match[2];
  const from = file.indexOf(match[0]) + match[0].indexOf(match[1] + match[2] + match[3]) + match[1].length;
  const to = from + name.length
  return {
    name,
    pos: {from, to}
  };
};

const matchRequiresFiles = file => {
  const match = file.match(requireFileG) || [];
  return match
    .map(snipet => createDependency(file, snipet.match(requireFile)));
};

const matchImportFiles = file => {
  const match = file.match(importFileG) || [];
  return match
    .map(snipet => createDependency(file, snipet.match(importFile)));
};

const matchImportSegments = file => {
  const match = file.match(importSegmentG) || [];
  return match
    .map(snipet => createDependency(file, snipet.match(importSegment)));
};

const matchDependencies = file => {
  return matchRequiresFiles(file)
    .concat(matchImportFiles(file))
    .concat(matchImportSegments(file));
};

module.exports = {
  requireFile,
  importFile,
  importSegment,
  requireFileG,
  importFileG,
  importSegmentG,
  matchRequiresFiles,
  matchImportFiles,
  matchImportSegments,
  matchDependencies
};
