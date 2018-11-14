const requireFile = /require(\s)*\(\s*('|")(\S+)('|")\s*\)/;

const importFile = /import(\s)*('|")(\S+)('|")/;

const importSegment = /import(.|\n)*?from\s*('|")(\S+)('|")/;

const requireFileG = new RegExp(requireFile.source, 'g');

const importFileG = new RegExp(importFile.source, 'g');

const importSegmentG = new RegExp(importSegment.source, 'g');

const createDependency = (file, matches) => {
  matches = matches.map(m => m || '');
  const name = matches[3];
  const from =
    file.indexOf(matches[0]) +
    matches[0].indexOf(matches[1] + matches[2] + matches[3] + matches[4]) +
    matches[1].length +
    matches[2].length;
  const to = from + name.length;
  return {
    name,
    pos: {from, to}
  };
};

const matchRequiresFiles = file => {
  const match = file.match(requireFileG) || [];
  return match.map(snipet => createDependency(file, snipet.match(requireFile)));
};

const matchImportFiles = file => {
  const match = file.match(importFileG) || [];
  return match.map(snipet => createDependency(file, snipet.match(importFile)));
};

const matchImportSegments = file => {
  const match = file.match(importSegmentG) || [];
  return match.map(snipet =>
    createDependency(file, snipet.match(importSegment))
  );
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
