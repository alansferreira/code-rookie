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
