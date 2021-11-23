import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync } from 'fs'
import { join } from 'path'
import { FSTemplateItem, FSWorkspace, isMatchGlob } from './fs-project'
import { HandlebarsProcessor } from './plugins/processors/handlebars.processor'

const templatesFolder =
  '/media/alf/usr-data/dev/repo/github.com/alansferreira/stages/easy-peasy/templates'
const workspaceFolder = join(templatesFolder, 'ts-monorepo')
const outputFolder = join(templatesFolder, 'ts-monorepo-generated')
const dataFile = join(templatesFolder, 'ts-monorepo-data.json')

describe('Utility functions', () => {
  test('isMatchGlob', () => {
    expect(
      isMatchGlob('project/node_modules', ['**/node_modules'])
    ).toBeTruthy()

    expect(
      isMatchGlob('project/node_modules/', ['**/node_modules'])
    ).toBeTruthy()

    expect(isMatchGlob('./node_modules', ['**/node_modules'])).toBeFalsy()

    expect(
      isMatchGlob('project/package/.git', ['**/node_modules', '**/.git'])
    ).toBeTruthy()

    expect(
      isMatchGlob('project/package/assets/image.jpg', [
        '**/node_modules',
        '**/.git',
        '**/*.jpg'
      ])
    ).toBeTruthy()
  })
})

describe('FileTemplateItem tests', () => {
  test('Constructor', () => {
    const ft = new FSTemplateItem(
      join(workspaceFolder, '/template/{{teste}}/.keep')
    )
    expect(ft.name).toEqual(join(workspaceFolder, '/template/{{teste}}/.keep'))
  })
})

describe('Workspace tests', () => {
  // test('Constructor', () => {
  //   expect(wrk.name).toEqual('{{teste}}')
  //   expect(wrk.type).toEqual('FOLDER')
  // })

  beforeAll(async () => {
    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
    mkdirSync(outputFolder, { recursive: true })
  })

  afterAll(async () => {
    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
  })
  test('Constructor', () => {
    const wrk = new FSWorkspace(workspaceFolder, outputFolder)

    expect(wrk.itens.length).toBeGreaterThan(9)
    for (const item of wrk.itens) {
      expect(item.name).toBeTruthy()
      expect(item.type).toBeTruthy()
    }
  })

  test('folder templating', async () => {
    const wrk = new FSWorkspace(workspaceFolder, outputFolder)
    const templateData = JSON.parse(readFileSync(dataFile).toString())

    await wrk.render(templateData, new HandlebarsProcessor())

    expect(readdirSync(wrk.outputFolder).length).toBeGreaterThan(0)
  })
})
