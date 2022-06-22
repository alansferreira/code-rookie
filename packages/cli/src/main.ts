import { Command, Help } from 'commander'
// import { version } from '../package.json'
import { FSWorkspace } from '@code-rookie/core/fs-project'
import { HandlebarsProcessor } from '@code-rookie/core/plugins/processors/handlebars.processor'
import { readFileSync } from 'fs'
import { resolve } from 'path'
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json')).toString()
)
const {
  version,
  pkg: { assemblyName }
} = packageJson

interface IRenderOptions {
  input?: string
  output?: string
  processor?: string
  dataFile?: string
}

const renderCommand = (options: IRenderOptions) => {
  const { input, output, dataFile } = options

  const wrk = new FSWorkspace(input, output)

  wrk.render({ data: dataFile }, new HandlebarsProcessor())
  // console.log(options)
}
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

program
  .command('render')
  .exitOverride(commandExitOverride('render'))
  .option('-i, --input <input>', 'Input template folder', './template')
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
