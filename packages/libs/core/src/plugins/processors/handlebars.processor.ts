import {
  Context,
  InputTemplateItem,
  OutputTemplateItem,
  Processor
} from '../../interfaces'
import { compile, registerHelper } from 'handlebars'

export class HandlebarsProcessor implements Processor {
  name = 'handlebars'
  // private _instance: typeof Handlebars
  constructor() {
    // this._instance = Handlebars.create()
  }
  registerHelper(name: string, fn: (metadata: any, ...args: any[]) => any) {
    // this._instance.registerHelper(name, fn)
    registerHelper(name, fn)
  }
  render(
    context: Context,
    input: InputTemplateItem
  ): Promise<OutputTemplateItem> {
    return new Promise((resolve, reject) => {
      try {
        // const template = this._instance.precompile(input.input)
        const template = compile(input.input.toString())
        const result = template(context.data)
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
