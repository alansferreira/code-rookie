import { FSWorkspace } from '@code-rookie/core/fs-project'
import { HandlebarsProcessor } from '@code-rookie/core/plugins/processors/handlebars.processor'
import * as express from 'express'
import { cpSync, createReadStream, fstat } from 'fs'
import { pack } from 'tar-stream'
import { Body, Controller, Post, Request, Route, SuccessResponse } from 'tsoa'
import { Inject } from 'typescript-ioc'
import { GitRender } from '../services/git-render.service'
import { Clone, Cred } from 'nodegit'
import { v4 } from 'uuid'
import { join } from 'path'

interface GitConfig {
  uri: string
  branch: string
  encodedToken: string
}

interface PostBody {
  source: GitConfig
  destination: GitConfig

  template: {
    data: any
  }
}

@Route('/git')
export class HelloController extends Controller {
  @Inject private gitRenderService: GitRender

  @SuccessResponse('200', 'Success') // Custom success response
  @Post('/render')
  public async render(
    @Body() json: PostBody,
    @Request() req: express.Request
  ): Promise<string> {
    const { res }: { res: express.Response } = <any>req
    const id = v4()
    const base = join('./', id)
    const inPath = join(base, 'input')
    const outPath = join(base, 'output')

    const wrk = this.gitRenderService.getWorkspace(
      json.source.uri,
      inPath,
      outPath
    )
    const repo = wrk.repository

    await wrk.render(
      {
        data: json.template.data
      },
      new HandlebarsProcessor()
    )

      // TODO: add git destinations here!!
  }
}
