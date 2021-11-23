export type Metadata = any

export interface Processor {
  name: string
  registerHelper(
    name: string,
    fn: (metadata: Metadata, ...args: Metadata[]) => Metadata
  )
  render(
    context: Context,
    input: InputTemplateItem
  ): Promise<OutputTemplateItem>
}

export interface Context {
  data: Metadata
}

export interface InputTemplateItem {
  name?: string
  input: ReadableStream | Buffer
  output?: WritableStream
  parent?: InputTemplateItem
  children?: InputTemplateItem[]
}

export interface OutputTemplateItem {
  name?: string
  output: Buffer
  input?: InputTemplateItem
}

export interface Workspace<T extends InputTemplateItem> {
  itens: T[]
  templateSpec: TemplateOptions<T, Workspace<T>>
  loadConfig(): Promise<void>
  loadItens(): Promise<void>
}

export interface TemplateHooks<
  T extends InputTemplateItem,
  W extends Workspace<T>
> {
  preProcess?: (workspace: W) => Promise<void>
  beforeAll?: (workspace: W) => Promise<void>
  beforeEach?: (input: T, workspace: W) => Promise<void>
  afterEach?: (
    input: T,
    output: OutputTemplateItem,
    workspace: W
  ) => Promise<void>
  afterAll?: (workspace: W) => Promise<void>
  postProcess?: (workspace: W) => Promise<void>
}
export interface TemplateConfig {
  dataSchema?: string
  justCopy?: string[]
  ignore?: string[]
}
export interface TemplateOptions<
  T extends InputTemplateItem,
  W extends Workspace<T>
> {
  dataSchema?: any
  path?: string
  config?: TemplateConfig
  hooks?: TemplateHooks<T, W>
}
