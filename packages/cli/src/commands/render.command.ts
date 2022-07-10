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

export function build(program: Command) {
  return program
    .command('render')
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
}
