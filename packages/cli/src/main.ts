import { Command } from 'commander'
import { version } from '../package.json'
import { FSWorkspace } from '@easy-peasy/engine/fs-project'
import { HandlebarsProcessor } from '@easy-peasy/engine/plugins/processors/handlebars.processor'

interface IRenderOptions {
  input?: string
  output?: string
  processor?: string
  dataFile?: string
}

const program = new Command()
program
  .command('render')
  .option('-i, --input', 'Input template folder', './template')
  .option('-o, --output', 'Output processed folder', './output')
  .option('-p, --processor', 'Template processor name', 'handlebars')
  .option('-d, --data-file', 'JSON data file to apply template', './data.json')

  .action((options: IRenderOptions) => {
    const { input, output, dataFile } = options

    const wrk = new FSWorkspace(input, output)

    wrk.render({ data: dataFile }, new HandlebarsProcessor())
    // console.log(options)
  })

// program
//   .command('processor [processor]')
//   .option()
//   // .option('-p, --params <...>', '')
//   .action((input, output) => {
//     console.log(input)
//     console.log(output)
//   })
console.log(process.argv)
program.version(version)
program.parse(process.argv)
