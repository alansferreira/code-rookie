import { createReadStream, createWriteStream, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import { Packer } from './packer'
import { concatStreams, merge } from './utils/stream'

jest.setTimeout(60000)

describe('Tarball Workspace tests', () => {
  test('Tar add single entry', async () => {
    const packer = new Packer(createWriteStream('./teste.tar'))
    const contentFile = join(__dirname, './index.ts')
    const contentStat = statSync(contentFile)

    const entry = await packer.addEntry(
      {
        name: 'teste.txt',
        type: 'file',
        size: contentStat.size
      },
      createReadStream(contentFile)
    )

    entry.end()
    packer.finalize()

    const stat = statSync('./teste.tar')

    expect(stat.size).toBeGreaterThan(0)
  })

  test('Tar add multiple entries', async () => {
    const packer = new Packer(createWriteStream('./teste.tar'))

    for (const file of readdirSync(__dirname)) {
      const contentFile = join(__dirname, file)
      const contentStat = statSync(contentFile)
      if (contentStat.isDirectory()) continue

      const entry = await packer.addEntry(
        {
          name: file,
          type: 'file',
          size: contentStat.size
        },
        createReadStream(contentFile)
      )
      entry.end()
    }

    packer.finalize()

    const stat = statSync('./teste.tar')

    expect(stat.size).toBeGreaterThan(0)
  })

  test('Tar add entry with sufix water mark', async () => {
    const packer = new Packer(createWriteStream('./teste.tar'))
    const contentFile = join(__dirname, './index.ts')
    const contentStat = statSync(contentFile)

    const waterMark = Buffer.from('\n teste append')
    const readableWaterMark = Readable.from(waterMark)

    const entry = await packer.addEntry(
      {
        name: 'teste.txt',
        type: 'file',
        size: contentStat.size + waterMark.length
      },
      Readable.from(
        await concatStreams(createReadStream(contentFile), readableWaterMark)
      )
    )

    entry.end()
    packer.finalize()

    const stat = statSync('./teste.tar')

    expect(stat.size).toBeGreaterThan(0)
  })
})
