import { GitWorkspace } from '@code-rookie/core/git-project'
import { Singleton } from 'typescript-ioc'
import { CloneOptions, Cred } from 'nodegit'

const defaultCloneOptions: CloneOptions = {
  fetchOpts: {
    callbacks: {
      credentials: function (url, userName) {
        return Cred.sshKeyFromAgent(userName)
      }
    }
  }
}

@Singleton
export class GitRender {
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
