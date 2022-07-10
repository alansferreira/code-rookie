import { Command, Help } from 'commander'
// import { version } from '../package.json'
import { FSWorkspace } from '@code-rookie/core/fs-project'
import { HandlebarsProcessor } from '@code-rookie/core/plugins/processors/handlebars.processor'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { build } from './commands/render.command'
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json')).toString()
)
const {
  version,
  pkg: { assemblyName }
} = packageJson

const program = new Command()
program.version(version)
program.name(assemblyName)
program.exitOverride((error) => {
  console.error(program.helpInformation())
  process.exit(error.exitCode)
})
program.configureHelp({
  sortSubcommands: true
})

function commandExitOverride(commandName: string) {
  return (error) => {
    const cmd = program.commands.find((c) => c.name() === commandName)
    if (!cmd) {
      console.error(program.helpInformation())
    } else {
      console.error(cmd.helpInformation())
    }
    process.exit(error.exitCode)
  }
}

build(program).exitOverride(commandExitOverride('render'))

program
  .command('render')
  .exitOverride(commandExitOverride('render'))
  .option(
    '-d, --directory <directory>',
    'Input template folder from local',
    './template'
  )
  .option(
    '-t, --tar <tarball>',
    'Input template folder from tarball(.tar) file'
  )
  .option('-g, --git <git>', 'Input template folder from git')
  .option(
    '-m, --m <manifest>',
    'Manisfest file in relative path from input type',
    'template.yaml'
  )
  .option('-o, --output <output>', 'Output processed folder', './output')
  .option(
    '-p, --processor <processorName>',
    'Template processor name',
    'handlebars'
  )
  .option(
    '-d, --data-file <dataFile>',
    'JSON data file to apply template',
    './data.json'
  )
  .action(renderCommand)

// program
//   .command('processor [processor]')
//   .option()
//   // .option('-p, --params <...>', '')
//   .action((input, output) => {
//     console.log(input)
//     console.log(output)
//   })

// console.log(process.argv)

try {
  program.parse(process.argv, { from: 'node' })
} catch (error) {
  console.info(program.helpInformation())
  console.error(error)
}
