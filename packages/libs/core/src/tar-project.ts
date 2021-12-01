import { Packer } from '@code-rookie/tar/packer'
import { debug } from 'console'
import { createReadStream, createWriteStream, mkdirSync, statSync } from 'fs'
import { basename, join, resolve } from 'path'
import { PassThrough, Readable, Writable } from 'stream'
import * as tar from 'tar-stream'
import { FSTemplateItem, FSWorkspace } from './fs-project'
import { OutputTemplateItem } from './interfaces'

export class TarWorkspace extends FSWorkspace {
  public packer: Packer
  public extractor: tar.Extract
  private entryQueue: tar.Headers[]

  constructor(
    public inputTarStream: Readable,
    public outputTarStream: Writable,
    public expandedFolder: string = './expanded',
    public renderFolder: string = './rendered',
    public configPath: string = '.template'
  ) {
    super(resolve(expandedFolder), resolve(renderFolder), configPath)

    this.packer = new Packer(outputTarStream)
    this.extractor = tar.extract({ emitClose: true })
    this.extractor.on('entry', this.onExtractEntry.bind(this))

    this.on('afterEach', this.onAfterEach.bind(this))
  }

  onAfterEach(
    input: FSTemplateItem,
    output: OutputTemplateItem,
    workspace: FSWorkspace
  ) {
    const { name: fullname } = output
    const { type } = input

    let name = fullname

    if (fullname.startsWith(workspace.renderFolder)) {
      name = fullname.substring(workspace.renderFolder.length)
    }

    debug(`onAfterEach: ${fullname}`)

    this.entryQueue.push({
      name,
      type: type === 'FILE' ? 'file' : 'directory'
    })
  }

  onExtractEntry(
    headers: tar.Headers,
    stream: PassThrough,
    next: (error?: unknown) => void
  ) {
    const { name: filePath, type, size } = headers
    const fullPath = join(this.expandedFolder, filePath)

    debug(`onExtractEntry: ${filePath} (${type}) ${size} -> ${fullPath}`)

    if (size > 1024 * 1024 * 2) {
      return next(new Error(`Tar entry '${filePath}' exceeds 3Mib.`))
    }

    if (type === 'directory') {
      // mkdirSync(fullPath, { recursive: true })
      return next()
    }

    const fileName = basename(fullPath)
    mkdirSync(fullPath.substring(0, fullPath.length - fileName.length), {
      recursive: true
    })

    stream
      .pipe(createWriteStream(fullPath, { autoClose: true }))
      // .on('end', next)
      // .on('close', next)
      .on('finish', next)
      .on('error', next)
    stream.resume()
  }

  async preRender(): Promise<void> {
    this.entryQueue = []

    await new Promise((resolve, reject) => {
      this.inputTarStream
        .pipe(this.extractor)
        // .on('close', resolve)
        // .on('end', resolve)
        .on('finish', resolve)
        .on('error', reject)
    })
    await this.loadConfig()
    await this.loadItens()
  }

  async postRender() {
    await super.postRender()

    // await new Promise<void>(async (resolve, reject) => {
    // this.packer.on('end', resolve).on('error', reject)
    for (const headers of this.entryQueue) {
      if (headers.type === 'file') {
        debug(`postRender: packaging ${headers.name}...`)
        const inputName = join(this.renderFolder, headers.name)
        const inputStat = statSync(inputName)
        // await this.addEntry(headers, readFileSync(inputName))
        const entry = await this.packer.addEntry(
          {
            name: headers.name,
            size: inputStat.size,
            type: 'file'
          },
          createReadStream(inputName)
        )
        entry.end()

        debug(`postRender: packed ${headers.name}!`)
      }
    }
    this.packer.finalize()
  }
}
