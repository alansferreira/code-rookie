import { existsSync, mkdirSync, readdirSync, rmdirSync } from 'fs'
import { Cred } from 'nodegit'
import { join } from 'path'
import { GitWorkspace } from './git-project'

const templatesFolder =
  '/media/alf/usr-data/dev/repo/github.com/alansferreira/stages/easy-peasy/templates/git-tests'
const workspaceFolder = join(templatesFolder, 'ts-monorepo')
const outputFolder = join(templatesFolder, 'ts-monorepo-generated')
const dataFile = join(templatesFolder, 'ts-monorepo-data.json')
const gitTemplateUrl = 'git@github.com:alellpro/typescript-monorepo.git'

describe('Git Workspace tests', () => {
  // test('Constructor', () => {
  //   expect(wrk.name).toEqual('{{teste}}')
  //   expect(wrk.type).toEqual('FOLDER')
  // })
  function cleanFolders() {
    if (existsSync(outputFolder)) {
      rmdirSync(outputFolder, { recursive: true })
    }
    if (existsSync(workspaceFolder)) {
      rmdirSync(workspaceFolder, { recursive: true })
    }
  }

  beforeAll(async () => {
    cleanFolders()
    mkdirSync(outputFolder, { recursive: true })
  })

  afterAll(async () => {
    cleanFolders()
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
    await wrk.clone()
    const clonedFiles = readdirSync(wrk.outputFolder).length
    expect(clonedFiles).toBeGreaterThan(0)
  })

  // test('folder templating', async () => {
  //   const wrk = new FSWorkspace(workspaceFolder, outputFolder)
  //   const templateData = JSON.parse(readFileSync(dataFile).toString())

  //   await wrk.render(templateData, new HandlebarsProcessor())

  //   expect(readdirSync(wrk.outputFolder)).toHaveProperty('length')
  // })
})
