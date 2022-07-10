export type Metadata = any

export interface Processor {
  name: string
  registerHelper(name: string, fn: (...args: Metadata[]) => Metadata): void

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

export interface WorkspaceEvents<T extends InputTemplateItem> {
  beforeAll: (workspace: Workspace<T>) => void
  beforeEach: (input: T, workspace: Workspace<T>) => void
  afterEach: (
    input: T,
    output: OutputTemplateItem,
    workspace: Workspace<T>
  ) => void
  afterAll: (workspace: Workspace<T>) => void
}

export declare interface Workspace<T extends InputTemplateItem> {
  itens: T[]
  templateSpec: TemplateOptions<T, Workspace<T>>

  preRender(): Promise<void>
  loadConfig(): Promise<void>
  loadItens(): Promise<void>
  render(context: Context, processor: Processor): Promise<void>
  postRender(): Promise<void>

  on<E extends keyof WorkspaceEvents<T>>(
    event: E,
    listener: WorkspaceEvents<T>[E]
  ): this

  emit<E extends keyof WorkspaceEvents<T>>(
    event: E,
    ...args: Parameters<WorkspaceEvents<T>[E]>
  ): boolean
}

export interface TemplateHooks<
  T extends InputTemplateItem,
  W extends Workspace<T>
> {
  beforeAll?: (workspace: W) => Promise<void>
  beforeEach?: (input: T, workspace: W) => Promise<void>
  afterEach?: (
    input: T,
    output: OutputTemplateItem,
    workspace: W
  ) => Promise<void>
  afterAll?: (workspace: W) => Promise<void>
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
