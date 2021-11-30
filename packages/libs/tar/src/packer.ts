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
    const entry = this.packer.entry(headers)

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
