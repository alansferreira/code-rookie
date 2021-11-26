import { createWriteStream, mkdirSync } from 'fs'
import { basename, dirname, join } from 'path'
import { PassThrough, Readable, Writable } from 'stream'
import * as tar from 'tar-stream'
import { FSWorkspace } from './fs-project'

export class TarWorkspace extends FSWorkspace {
  public packer: tar.Pack
  public extractor: tar.Extract

  constructor(
    public inputTarStream: Readable,
    public inputFolder: string,
    public outputTarStream: Writable,
    public configPath: string = '.template'
  ) {
    super(join(inputFolder, 'expanded'), join(inputFolder, 'output'), configPath)

    this.packer = tar.pack({})
    this.extractor = tar.extract({ emitClose: true })
    this.extractor.on('entry', this.onExtractEntry.bind(this))
  }

  onExtractEntry(
    headers: tar.Headers,
    stream: PassThrough,
    next: (error?: unknown) => void
  ) {
    const { name: filePath, type, size } = headers
    const fullPath = join(this.inputFolder, filePath)

    console.log(`${filePath} (${type}) ${size} -> ${fullPath}`)

    if (size > 1024 * 1024 * 2) {
      return next(new Error(`Tar entry '${filePath}' exceeds 3Mib.`))
    }

    if (type === 'directory') {
      mkdirSync(fullPath, { recursive: true })
      return next()
    }

    const fileName = basename(fullPath)
    mkdirSync(fullPath.substring(0, fullPath.length - fileName.length), {
      recursive: true
    })

    stream.resume()
    stream
      .pipe(createWriteStream(fullPath, { autoClose: true }))
      .on('end', next)
      .on('close', next)
      .on('finish', next)
      .on('error', next)
    // const filePath = headers.path
    // const type = entry.type // 'Directory' or 'File'
    // const size = entry.size // might be undefined in some archives

    // if (type === 'Directory') {
    //   entry.autodrain()
    //   return
    // }

    // const fullpath = resolve(this.tempPath, filePath)
    // entry.pipe(createWriteStream(fullpath))
  }

  async postRender(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.packer
        .pipe(this.outputTarStream)
        .on('close', resolve)
        .on('error', reject)
        .on('finish', resolve)
        .on('unpipe', reject)
    })
  }

  async preRender(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inputTarStream
        .pipe(this.extractor)
        .on('finish', resolve)
        .on('close', resolve)
        .on('end', resolve)
        .on('error', reject)
    })
  }
}
