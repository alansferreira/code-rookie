import { GitWorkspace } from '@code-rookie/core/git-project'
import { Singleton } from 'typescript-ioc'
import { CloneOptions, Cred, Branch, Signature, Repository } from 'nodegit'

const defaultCloneOptions: CloneOptions = {
  fetchOpts: {
    callbacks: {
      credentials: function (url, userName) {
        return Cred.sshKeyFromAgent(userName)
      }
    }
  }
}
const epoch = () => Math.floor(new Date().getTime() / 1000.0)

@Singleton
export class GitRender {
  async getSignature(repo: Repository) {
    let result = Signature.default(repo)

    if (!result) {
      result = Signature.create(
        'code-rookie',
        'render@code-rookie.com',
        epoch(),
        new Date().getTimezoneOffset()
      )
    }

    return result
  }
  getWorkspace(gitUrl: string, inputFolder: string, outputPath: string) {
    return new GitWorkspace(
      gitUrl,
      inputFolder,
      outputPath,
      undefined,
      defaultCloneOptions
    )
  }
}
