const program = require('commander');
const dependencies = require('./lib/dependencies');
const move = require('./lib/move');
const package = require('./package.json');

const defaultConfigPath = './resolver.config.js';

program
  .version(package.version);

program
  .command('dependencies <pattern>')
  .description('Displays the dependencies of the nested files')
  .option('--printFormat [printFormat]', 'The print format of the result json|raw|onlyDependencies', /^(json|raw|onlyDependencies)$/i, 'json')
  .option('--ignoreEmpty', 'Strip off the files with no dependencies', false)
  .option('--onlyExternal', 'Add only the external dependencies', false)
  .action((pattern, cmd) => {
    dependencies.printDependencies(pattern, {
      printFormat: cmd.printFormat,
      ignoreEmpty: cmd.ignoreEmpty,
      onlyExternal: cmd.onlyExternal
    });
  });

program
  .command('move <configPath>')
  .action(configPath => {
    move(configPath || defaultConfigPath);
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
