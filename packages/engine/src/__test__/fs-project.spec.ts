import { existsSync, mkdirSync, readdirSync, rmdirSync } from 'fs'
import path, { join } from 'path'
import { FSTemplateItem, FSWorkspace } from '../fs-project'
import { HandlebarsProcessor } from '../plugins/processors/handlebars.processor'

const workspaceFolder = join(__dirname, 'workspace')
const outputFolder = join(__dirname, 'output')
const wrk = new FSWorkspace(workspaceFolder, outputFolder)

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
  test('ReadTree', () => {
    expect(wrk.itens.length).toBeGreaterThan(9)
    for (const item of wrk.itens) {
      expect(item.name).toBeTruthy()
      expect(item.type).toBeTruthy()
    }
  })

  test('folder templating', async () => {
    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
    mkdirSync(outputFolder, { recursive: true })

    await wrk.render(
      { data: { teste: 'hello', 'some-teste': 'annoter some hello' } },
      new HandlebarsProcessor()
    )
    expect(readdirSync(wrk.outputFolder)).toHaveProperty('length')
  })
})
