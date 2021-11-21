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
import {
  Context,
  InputTemplateItem,
  OutputTemplateItem,
  Processor
} from './interfaces'
import minimatch from 'minimatch'

export interface WorkspaceConfig {
  dataSchema?: string
  justCopy?: string[]
  ignore?: string[]
}

export interface WorkspaceOptions {
  awaysReloadConfig?: boolean
  configPath?: string
}

export class FSWorkspace {
  itens: FSTemplateItem[] = []
  _config: WorkspaceConfig

  constructor(
    public inputFolder: string,
    public outputFolder: string,
    public options?: WorkspaceOptions
  ) {
    for (const entity of readdirSync(inputFolder)) {
      const fullpath = join(inputFolder, entity)
      if (isMatchGlob(fullpath, this.config?.ignore || [])) {
        continue
      }

      const el = new FSTemplateItem(fullpath, this)
      this.itens.push(el)
      for (const subitem of this.readtree(el)) {
        this.itens.push(subitem)
      }
    }
  }
  get configPath() {
    return join(this.inputFolder, '.template', 'config.json')
  }

  get config(): WorkspaceConfig {
    if (this._config && !this?.options?.awaysReloadConfig) return this._config

    if (existsSync(this.configPath)) {
      this._config = JSON.parse(readFileSync(this.configPath).toString())
    } else {
      this._config = null
      console.warn(`Config file '${this.configPath}' not founded!`)
    }

    return this._config
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

  children: FSTemplateItem[] = []

  constructor(
    public name: string,
    public workspace?: FSWorkspace,
    public parent?: FSTemplateItem
  ) {
    this.type = statSync(this.name).isDirectory() ? 'FOLDER' : 'FILE'
  }
  *[Symbol.iterator](): Iterator<FSTemplateItem, any, undefined> {
    if (this.type === 'FILE') return

    for (const entity of readdirSync(this.name)) {
      yield new FSTemplateItem(join(this.name, entity), this.workspace, this)
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
    const inputContent = readFileSync(this.name)
    let outputContent = inputContent

    if (!isMatchGlob(this.name, this.workspace?.config?.justCopy || [])) {
      try {
        const rendered = await processor.render(context, {
          ...this,
          input: readFileSync(this.name)
        })
        outputContent = rendered.output
      } catch (error) {
        throw new Error(
          `The file template '${this.name}' can not processed by '${processor.name}' processor, check sintax on file or review your 'justCopy' at '${this.workspace?.configPath}'!`
        )
      }
    }

    return {
      name: destName.output.toString(),
      output: outputContent,
      input: this
    }
  }
}
export const isMatch = (
  target: string,
  pattern: string,
  options?: minimatch.IOptions
) => {
  // if (target.startsWith(pattern) || target.endsWith(pattern)) return true
  return minimatch(target, pattern, options)
}

/**
 * Check if path match in any patterns
 * @param target full path for compare to patterns
 * @param pattern patters to check if match
 * @returns list of patters that matches
 */
export const matchGlob = (
  target: string,
  pattern: string | string[]
): string[] => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern]

  return patterns.filter((p) => isMatch(target, p, { dot: true }))
}
/**
 * Check if path match in any patterns
 * @param target full path for compare to patterns
 * @param pattern patters to check if match
 * @returns list of patters that matches
 */
export const isMatchGlob = (
  target: string,
  pattern: string | string[]
): boolean => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern]

  const founded = patterns.find((p) =>
    isMatch(target, p, { dot: true, matchBase: true })
  )

  return !!founded
}
