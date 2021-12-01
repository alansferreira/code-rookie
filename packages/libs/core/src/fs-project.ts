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
  Workspace,
  WorkspaceEvents
} from './interfaces'
import minimatch from 'minimatch'
import EventEmitter from 'events'
import { warn } from 'console'

export declare interface FSWorkspace {
  on<U extends keyof WorkspaceEvents<FSTemplateItem>>(
    event: U,
    listener: WorkspaceEvents<FSTemplateItem>[U]
  ): this

  emit<U extends keyof WorkspaceEvents<FSTemplateItem>>(
    event: U,
    ...args: Parameters<WorkspaceEvents<FSTemplateItem>[U]>
  ): boolean
}

export class FSWorkspace
  extends EventEmitter
  implements Workspace<FSTemplateItem>
{
  itens: FSTemplateItem[] = []
  templateSpec: TemplateOptions<FSTemplateItem, Workspace<FSTemplateItem>>

  constructor(
    public expandedFolder: string,
    public renderFolder: string,
    public configPath: string = '.template'
  ) {
    super({ captureRejections: true })
  }

  async preRender(): Promise<void> {
    await this.loadConfig()
    await this.loadItens()
  }

  async postRender(): Promise<void> {
    return
  }

  get templateSpecPath() {
    if (existsSync(this.configPath)) return resolve(this.configPath)
    return resolve(this.expandedFolder, this.configPath)
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
      warn(`Config file '${configJson}' not founded!`)
    }

    if (existsSync(dataSchemaJson)) {
      dataSchema = JSON.parse(readFileSync(dataSchemaJson).toString())
    } else {
      warn(`Data Schema file '${dataSchemaJson}' not founded!`)
    }

    // Load all external hooks from '.template' folder if exists
    const modules: Array<keyof TemplateHooks<FSTemplateItem, FSWorkspace>> = [
      'beforeAll',
      'beforeEach',
      'afterEach',
      'afterAll'
    ]
    for (const module of modules) {
      const modulePath = join(templateSpecPath, module)
      if (existsSync(modulePath + '.js')) {
        hooks[module] = require(modulePath)
      }
    }

    this.templateSpec = {
      path: templateSpecPath,
      config,
      dataSchema,
      hooks
    }
  }
  async loadItens() {
    const { expandedFolder: inputFolder, templateSpec } = this
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
    await this.preRender()

    const { expandedFolder, renderFolder, itens, templateSpec } = this
    const {
      beforeAll: hookBeforeAll,
      beforeEach: hookBeforeEach,
      afterEach: hookAfterEach,
      afterAll: hookAfterAll
    } = templateSpec?.hooks || {}

    this.emit('beforeAll', this)
    if (hookBeforeAll) await hookBeforeAll(this)

    if (existsSync(renderFolder)) {
      rmdirSync(renderFolder, { recursive: true })
    }
    mkdirSync(renderFolder, { recursive: true })

    for (const fsitem of itens) {
      const { type } = fsitem
      if (type !== 'FILE') continue

      this.emit('beforeEach', fsitem, this)
      if (hookBeforeEach) await hookBeforeEach(fsitem, this)

      const r = await fsitem.render(context, processor)

      const relativePath = (r?.name || fsitem.name).substring(
        expandedFolder.length
      )
      const dirPath = relativePath.substring(
        0,
        relativePath.length - basename(relativePath).length
      )

      r.name = join(renderFolder, relativePath)
      mkdirSync(join(renderFolder, dirPath), { recursive: true })
      writeFileSync(join(renderFolder, relativePath), r.output)

      this.emit('afterEach', fsitem, r, this)
      if (hookAfterEach) await hookAfterEach(fsitem, r, this)
    }

    this.emit('afterAll', this)
    if (hookAfterAll) await hookAfterAll(this)

    await this.postRender()
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
