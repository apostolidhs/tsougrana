const toPathnameParts = (pathname = '', base) =>
  pathname
    .replace(base, '')
    .split('/')
    .filter(exists => exists);

const partsToPathname = (parts = [], dots = 0) =>
  (dots === 0 ? './' : '../'.repeat(dots)) + parts.join('/');

module.exports = args => {
  const {file, depFile, resolvesTo, base, relativeResolutionDepth} = args;
  const fileParts = toPathnameParts(file, base);
  const depFileParts = toPathnameParts(depFile, base);

  if (fileParts[0] !== depFileParts[0]) {
    return resolvesTo || depFileParts.join('/');
  }

  const index = fileParts.findIndex(
    (part, i) => depFileParts[i] && depFileParts[i] !== part
  );
  const backDots = fileParts.slice(index).length - 1;
  return index >= 0 && backDots < relativeResolutionDepth
    ? partsToPathname(depFileParts.slice(index), backDots)
    : resolvesTo || depFileParts.join('/');
};
