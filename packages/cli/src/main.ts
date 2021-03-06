import { Command } from 'commander'
// import { version } from '../package.json'
import { FSWorkspace } from '@code-rookie/core/fs-project'
import { HandlebarsProcessor } from '@code-rookie/core/plugins/processors/handlebars.processor'

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
program
  .command('render')
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
// program.version(version)
program.parse(process.argv)
