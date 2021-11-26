import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  rmSync,
  statSync
} from 'fs'
import { join, resolve } from 'path'
import { TarWorkspace } from './tar-project'

const templatesFolder = resolve(process.cwd(), '../../../templates')
const inputTarFile = join(templatesFolder, 'typescript-monorepo.tar')
const outputTarFile = join(templatesFolder, 'typescript-monorepo.output.tar')
const workspaceFolder = join(templatesFolder, 'tar/input')
const outputFolder = join(templatesFolder, 'tar/output')
const dataFile = join(templatesFolder, 'typescript-monorepo-data.json')

jest.setTimeout(60000)

describe('Tarball Workspace tests', () => {
  // test('Constructor', () => {
  //   expect(wrk.name).toEqual('{{teste}}')
  //   expect(wrk.type).toEqual('FOLDER')
  // })
  function cleanTemporaryResources() {
    const entries = [workspaceFolder, outputTarFile, outputFolder]
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
      workspaceFolder,
      createWriteStream(outputTarFile),
      outputFolder
    )
    try {
      await wrk.preRender()
    } catch (error) {
      console.error(error)
    }
    const expandedFiles = readdirSync(workspaceFolder).length
    expect(expandedFiles).toBeGreaterThan(0)
  })
})
