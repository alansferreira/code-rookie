import { existsSync, readdirSync, rmdirSync, rmSync, statSync } from 'fs'
import { Cred } from 'nodegit'
import { join, resolve } from 'path'
import { GitWorkspace } from './git-project'

const templatesFolder = resolve(process.cwd(), '../../../templates/git-tests')
const workspaceFolder = join(templatesFolder, 'typescript-monorepo')
const outputFolder = join(templatesFolder, 'typescript-monorepo-generated')
const dataFile = join(templatesFolder, 'typescript-monorepo-data.json')
const gitTemplateUrl = 'git@github.com:alansferreira/typescript-monorepo.git'

describe('Git Workspace tests', () => {
  // test('Constructor', () => {
  //   expect(wrk.name).toEqual('{{teste}}')
  //   expect(wrk.type).toEqual('FOLDER')
  // })
  function cleanTemporaryResources() {
    const entries = [workspaceFolder, outputFolder]
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

  test('Cloning from ssh', async () => {
    const wrk = new GitWorkspace(
      gitTemplateUrl,
      workspaceFolder,
      outputFolder,
      undefined,
      {
        fetchOpts: {
          callbacks: {
            credentials: function (url, userName) {
              return Cred.sshKeyFromAgent(userName)
            }
          }
        }
      }
    )
    await wrk.preRender()
    const clonedFiles = readdirSync(wrk.expandedFolder).length
    expect(clonedFiles).toBeGreaterThan(0)
  })

  // test('folder templating', async () => {
  //   const wrk = new FSWorkspace(workspaceFolder, outputFolder)
  //   const templateData = JSON.parse(readFileSync(dataFile).toString())

  //   await wrk.render(templateData, new HandlebarsProcessor())

  //   expect(readdirSync(wrk.outputFolder)).toHaveProperty('length')
  // })
})
