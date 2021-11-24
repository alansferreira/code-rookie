import { Clone, CloneOptions, Repository } from 'nodegit'
import { FSWorkspace } from './fs-project'

export class GitWorkspace extends FSWorkspace {
  public repository: Repository
  constructor(
    public gitUrl: string,
    public inputFolder: string,
    public outputPath: string,
    public configPath: string = '.template',
    public gitOptions?: CloneOptions
  ) {
    super(inputFolder, outputPath, configPath)
  }
  async clone(): Promise<void> {
    const { gitUrl, inputFolder: localPath, gitOptions } = this
    this.repository = await Clone.clone(gitUrl, localPath, gitOptions)
  }
  async loadConfig(): Promise<void> {
    const { gitUrl, inputFolder: localPath, gitOptions } = this
    this.repository = await Clone.clone(gitUrl, localPath, gitOptions)
    await super.loadConfig()
  }
}
