import { Clone, CloneOptions, Repository } from 'nodegit'
import { FSWorkspace } from './fs-project'

export class GitWorkspace extends FSWorkspace {
  public repository: Repository
  constructor(
    public gitUrl: string,
    public expandedFolder: string,
    public outputPath: string,
    public configPath: string = '.template',
    public gitOptions?: CloneOptions
  ) {
    super(expandedFolder, outputPath, configPath)
  }
  async preRender(): Promise<void> {
    const { gitUrl, expandedFolder, gitOptions } = this
    this.repository = await Clone.clone(gitUrl, expandedFolder, gitOptions)
  }
}
