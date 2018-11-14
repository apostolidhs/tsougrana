const toPathnameParts = (pathname = '', base) => pathname
  .replace(base, '')
  .split('/')
  .filter(exists => exists);

const partsToPathname = (parts = [], dots = 0) => (dots === 0 ? './' : '../'.repeat(dots)) + parts.join('/');

module.exports = (filePath, {to: depPath, finalBase}, resolvesTo) => {
  filePathParts = toPathnameParts(filePath, finalBase);
  const depPathParts = toPathnameParts(depPath, finalBase);

  if (filePathParts[0] !== depPathParts[0]) {
    return resolvesTo || depPathParts.join('/');
  }

  const index = filePathParts.findIndex((part, i) => depPathParts[i] && depPathParts[i] !== part);
  const backDots = filePathParts.slice(index).length - 1;
  return index >= 0 && backDots < 4
    ? partsToPathname(depPathParts.slice(index), backDots)
    : resolvesTo || depPathParts.join('/');
}
