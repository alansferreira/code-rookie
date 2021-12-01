import { Readable, Writable } from 'stream'
import * as tar from 'tar-stream'

export class Packer {
  public packer: tar.Pack

  constructor(public outputTarStream: Writable) {
    this.packer = tar.pack({ emitClose: true })
    this.packer.pipe(outputTarStream)
  }

  async addEntry(
    headers: tar.Headers,
    buffer?: Buffer | Readable
  ): Promise<Writable> {
    let { name } = headers
    if (name.startsWith('/')) name = name.substring(1)
    if (/\.+\//.test(name)) {
      throw new Error(
        `Entries names could not have relative paths like '../' or './' caused by '${name}'!`
      )
    }
    const entry = this.packer.entry({ ...headers, name })

    if (!buffer) return entry

    if (buffer instanceof Buffer) {
      await new Promise<void>((resolve, reject) => {
        entry.write(buffer, (error) => {
          if (error) return reject(error)
          resolve()
        })
      })
    }

    if (buffer instanceof Readable) {
      await new Promise<void>((resolve, reject) => {
        buffer.pipe(entry).on('finish', resolve).on('error', reject)
      })
    }
    return entry
  }

  finalize() {
    this.packer.finalize()
  }
}
