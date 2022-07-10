import {
  Context,
  InputTemplateItem,
  OutputTemplateItem,
  Processor
} from '../../interfaces'
import { compile, Environment } from 'nunjucks'

export class NunjucksProcessor implements Processor {
  name = 'nunjucks'
  constructor(
    public env: Environment = new Environment(undefined, {
      // tags: {
      //   blockStart: '${{',
      //   blockEnd: '}}'
      // }
    })
  ) {}
  registerHelper(name: string, fn: (...args: any[]) => any) {
    // this._instance.registerHelper(name, fn)
    this.env.addFilter(name, fn)
  }
  render(
    context: Context,
    input: InputTemplateItem
  ): Promise<OutputTemplateItem> {
    return new Promise((resolve, reject) => {
      try {
        const template = compile(input.input.toString(), this.env)
        const result = template.render(context.data)
        resolve({
          input: input,
          output: Buffer.from(result)
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}
