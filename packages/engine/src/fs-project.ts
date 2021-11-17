import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, join } from 'path'
import { dirname } from 'path/posix'
import {
  Context,
  InputTemplateItem,
  OutputTemplateItem,
  Processor
} from './interfaces'

export class FSWorkspace {
  itens: FSTemplateItem[] = []
  constructor(public inputFolder: string, public outputFolder: string) {
    for (const entity of readdirSync(inputFolder)) {
      const el = new FSTemplateItem(join(inputFolder, entity))
      this.itens.push(el)
      this.itens.push(...this.readtree(el))
    }
  }

  readtree(fsitem: FSTemplateItem): FSTemplateItem[] {
    const result = []
    for (const el of fsitem) {
      result.push(el)
      if (el.type === 'FOLDER') {
        result.push(...this.readtree(el))
      }
    }
    return result
  }

  async render(context: Context, processor: Processor) {
    const { inputFolder, outputFolder, itens } = this

    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
    mkdirSync(outputFolder, { recursive: true })

    for (const fsitem of itens) {
      const { type } = fsitem
      if (type !== 'FILE') continue

      const r = await fsitem.render(context, processor)

      const relativePath = (r?.name || fsitem.name).substring(
        inputFolder.length
      )
      const dirPath = relativePath.substring(
        0,
        relativePath.length - basename(relativePath).length
      )
      mkdirSync(join(outputFolder, dirPath), { recursive: true })
      writeFileSync(join(outputFolder, relativePath), r.output)
    }
  }
}

export class FSTemplateItem
  implements InputTemplateItem, Iterable<FSTemplateItem>
{
  type?: 'FOLDER' | 'FILE'
  input: Buffer

  parent?: FSTemplateItem
  children: FSTemplateItem[] = []

  constructor(public name: string, parent?: FSTemplateItem) {
    this.type = statSync(this.name).isDirectory() ? 'FOLDER' : 'FILE'
  }
  *[Symbol.iterator](): Iterator<FSTemplateItem, any, undefined> {
    if (this.type === 'FILE') return

    for (const entity of readdirSync(this.name)) {
      yield new FSTemplateItem(join(this.name, entity), this)
    }
  }

  async render(
    context: Context,
    processor: Processor
  ): Promise<OutputTemplateItem> {
    const destName = await processor.render(context, {
      input: Buffer.from(this.name)
    })

    if (this.type === 'FOLDER') {
      // name: destName.output.toString(),
      // output: destContent.output,
      // input: this
      return null
    }

    const destContent = await processor.render(context, {
      ...this,
      input: readFileSync(this.name)
    })

    return {
      name: destName.output.toString(),
      output: destContent.output,
      input: this
    }
  }
}
