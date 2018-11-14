const path = require('path');
const log = require('./log');

const isValidAlias = alias =>
  alias &&
  (!typeof alias === 'object' ||
    Object.keys(alias).some(k => typeof alias[k] !== 'string'));

const toAbsolutePathAlias = (aliases, base) => {
  return Object.keys(aliases)
    .map(from => ({
      from,
      to: path.join(base, aliases[from])
    }))
    .sort((a1, a2) => a2.to.localeCompare(a1.to));
};

module.exports = configPath => {
  let config;
  try {
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.cwd(), configPath);
    config = require(absolutePath);
  } catch (e) {
    log.fatal(`cannot open file '${configPath}'`);
  }

  if (typeof config.toBase !== 'string') {
    log.fatal("invalid 'toBase' configuration");
  }

  if (typeof config.fromBase !== 'string') {
    log.fatal("invalid 'fromBase' configuration");
  }

  const {toBase, fromBase} = config;

  if (
    !Array.isArray(config.rules) ||
    config.rules.some(
      rule => typeof rule.from !== 'string' || typeof rule.to !== 'string'
    )
  ) {
    log.fatal("invalid 'rules' configuration");
  }

  const rules = config.rules.map(r => ({
    from: path.join(fromBase, r.from),
    to: path.join(toBase, r.to),
    finalBase: toBase,
    disableCamelCase: !!r.disableCamelCase
  }));

  if (isValidAlias(config.aliasFrom)) {
    log.fatal("invalid 'aliasFrom' configuration");
  }

  const aliasFrom = toAbsolutePathAlias(config.aliasFrom, fromBase);

  if (isValidAlias(config.aliasTo)) {
    log.fatal("invalid 'aliasTo' configuration");
  }

  const aliasTo = toAbsolutePathAlias(config.aliasTo, toBase);

  const ignoreFiles = config.ignoreFiles;
  if (ignoreFiles && !(ignoreFiles instanceof RegExp)) {
    log.fatal("'ignoreFiles' should be a regular expression");
  }

  return {
    toBase,
    fromBase,
    rules,
    aliasFrom,
    aliasTo,
    ignoreFiles
  };
};
