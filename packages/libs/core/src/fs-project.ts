import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, join, resolve } from 'path'
import {
  Context,
  InputTemplateItem,
  OutputTemplateItem,
  Processor,
  TemplateConfig,
  TemplateHooks,
  TemplateOptions,
  Workspace
} from './interfaces'
import minimatch from 'minimatch'

export class FSWorkspace implements Workspace<FSTemplateItem> {
  itens: FSTemplateItem[] = []
  templateSpec: TemplateOptions<FSTemplateItem, Workspace<FSTemplateItem>>

  constructor(
    public inputFolder: string,
    public outputFolder: string,
    public configPath: string = '.template'
  ) {}
  get templateSpecPath() {
    if (existsSync(this.configPath)) return resolve(this.configPath)
    return resolve(this.inputFolder, this.configPath)
  }

  async loadConfig(): Promise<void> {
    const { templateSpecPath } = this
    const configJson = join(templateSpecPath, 'config.json')
    const dataSchemaJson = join(templateSpecPath, 'data-schema.json')

    let dataSchema = undefined
    let config: TemplateConfig = {}
    const hooks: TemplateHooks<FSTemplateItem, FSWorkspace> = {}

    if (existsSync(configJson)) {
      config = JSON.parse(readFileSync(configJson).toString())
    } else {
      console.warn(`Config file '${configJson}' not founded!`)
    }

    if (existsSync(dataSchemaJson)) {
      dataSchema = JSON.parse(readFileSync(dataSchemaJson).toString())
    } else {
      console.warn(`Data Schema file '${dataSchemaJson}' not founded!`)
    }

    hooks.preProcess = require(join(templateSpecPath, 'preProcess'))
    hooks.beforeAll = require(join(templateSpecPath, 'beforeAll'))
    hooks.beforeEach = require(join(templateSpecPath, 'beforeEach'))
    hooks.afterEach = require(join(templateSpecPath, 'afterEach'))
    hooks.afterAll = require(join(templateSpecPath, 'afterAll'))
    hooks.postProcess = require(join(templateSpecPath, 'postProcess'))

    this.templateSpec = {
      path: templateSpecPath,
      config,
      dataSchema,
      hooks
    }
  }
  async loadItens() {
    const { inputFolder, templateSpec } = this
    for (const entity of readdirSync(inputFolder)) {
      const fullpath = join(inputFolder, entity)
      if (isMatchGlob(fullpath, templateSpec?.config?.ignore || [])) {
        continue
      }

      const el = new FSTemplateItem(fullpath, this)
      this.itens.push(el)
      for (const subitem of this.readtree(el)) {
        this.itens.push(subitem)
      }
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
    this.loadConfig()
    this.loadItens()

    const { inputFolder, outputFolder, itens, templateSpec } = this
    const {
      preProcess,
      beforeAll,
      beforeEach,
      afterEach,
      afterAll,
      postProcess
    } = templateSpec?.hooks || {}

    if (preProcess) await preProcess(this)
    if (beforeAll) await beforeAll(this)

    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
    mkdirSync(outputFolder, { recursive: true })

    for (const fsitem of itens) {
      const { type } = fsitem
      if (type !== 'FILE') continue

      if (beforeEach) await beforeEach(fsitem, this)

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

      if (afterEach) await afterEach(fsitem, r, this)
    }

    if (afterAll) await afterAll(this)
    if (postProcess) await postProcess(this)
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
    const { templateSpec } = this.workspace
    const { config } = templateSpec || {}
    const { justCopy } = config || {}

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

    if (!isMatchGlob(this.name, justCopy || [])) {
      try {
        const rendered = await processor.render(context, {
          ...this,
          input: readFileSync(this.name)
        })
        outputContent = rendered.output
      } catch (error) {
        throw new Error(
          `The file template '${this.name}' can not processed by '${processor.name}' processor, check sintax on file or review your 'justCopy' at '${templateSpec.path}'!`
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
