import { existsSync, rmdirSync, writeFileSync } from 'fs'
import {
  Clone,
  Repository,
  Branch,
  Signature,
  Cred,
  CloneOptions,
  Reference
} from 'nodegit'
import { basename, join } from 'path'

jest.setTimeout(60000)

const repoUrl = 'git@github.com:alansferreira/git-api-access.git'
const repoPath = join('./repo', basename(repoUrl, '.git'))
const defaultCloneOptions: CloneOptions = {
  fetchOpts: {
    callbacks: {
      credentials: function (url, userName) {
        return Cred.sshKeyFromAgent(userName)
      }
    }
  }
}

describe('Git tests', () => {
  beforeAll(async () => {
    if (existsSync(repoPath)) {
      rmdirSync(repoPath, { recursive: true })
    }
  })

  test('Git common steps', async () => {
    // clone
    const repo = await Clone.clone(repoUrl, repoPath, defaultCloneOptions)
    // create banch
    const currentCommit = await repo.getHeadCommit()
    const branch = await repo.createBranch('teste', currentCommit)
    await repo.checkoutBranch(branch, currentCommit)

    // create commit
    writeFileSync(join(repoPath, 'new-file.txt'), 'hello commit')
    const index = await repo.refreshIndex()
    await index.addAll()
    await index.write()
    const oid = await index.writeTree()

    const author = Signature.now(
      'Alan S. Ferreira',
      'alansferreira1984@gmail.com'
    )
    const committer = Signature.now(
      'Alan S. Ferreira',
      'alansferreira1984@gmail.com'
    )

    const parent = await repo.getHeadCommit()
    const newCommit = await repo.createCommit(
      'HEAD',
      author,
      committer,
      'message',
      oid,
      [parent]
    )

    // push new branch with new files
    const remotes = await repo.getRemotes()
    const origin = remotes.find((r) => r.name() === 'origin')
    await origin.push([branch], {
      callbacks: defaultCloneOptions.fetchOpts.callbacks
    })

    expect(origin).toBeTruthy()
  })
})
