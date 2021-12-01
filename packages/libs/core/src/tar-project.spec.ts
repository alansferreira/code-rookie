import {
  createReadStream,
  createWriteStream,
  existsSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync
} from 'fs'
import { join, resolve } from 'path'
import { HandlebarsProcessor } from './plugins/processors/handlebars.processor'
import { TarWorkspace } from './tar-project'

const templatesFolder = resolve(process.cwd(), '../../../templates/tar')
const inputTarFile = join(templatesFolder, 'typescript-monorepo.tar')
const outputTarFile = join(templatesFolder, 'typescript-monorepo.output.tar')
const expandedFolder = join(templatesFolder, 'input')
const renderedFolder = join(templatesFolder, 'output')
const dataFile = join(templatesFolder, '../typescript-monorepo-data.json')

jest.setTimeout(60000)

describe('Tarball Workspace tests', () => {
  // test('Constructor', () => {
  //   expect(wrk.name).toEqual('{{teste}}')
  //   expect(wrk.type).toEqual('FOLDER')
  // })
  function cleanTemporaryResources() {
    const entries = [expandedFolder, outputTarFile, renderedFolder]
    for (const entry of entries) {
      if (!existsSync(entry)) continue
      const stat = statSync(entry)
      if (stat.isFile()) rmSync(entry)
      if (stat.isDirectory()) rmdirSync(entry, { recursive: true })
    }
  }

  beforeAll(async () => {
    cleanTemporaryResources()
  })

  afterAll(async () => {
    cleanTemporaryResources()
  })

  test('Extract file', async () => {
    const wrk = new TarWorkspace(
      createReadStream(inputTarFile),
      createWriteStream(outputTarFile),
      expandedFolder,
      renderedFolder
    )
    try {
      await wrk.preRender()
    } catch (error) {
      console.error(error)
    }
    const expandedFiles = readdirSync(expandedFolder).length
    expect(expandedFiles).toBeGreaterThan(0)
  })

  test('Render template', async () => {
    const wrk = new TarWorkspace(
      createReadStream(inputTarFile),
      createWriteStream(outputTarFile),
      expandedFolder,
      renderedFolder,
      'typescript-monorepo/.template'
    )

    await wrk.render(
      { data: readFileSync(dataFile) },
      new HandlebarsProcessor()
    )
    expect(existsSync(outputTarFile)).toBeTruthy()
  })
})
