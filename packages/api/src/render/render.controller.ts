import { FSWorkspace } from '@code-rookie/core/fs-project'
import { HandlebarsProcessor } from '@code-rookie/core/plugins/processors/handlebars.processor'
import { Body, Controller, Post, Route, SuccessResponse } from 'tsoa'
import { Inject } from 'typescript-ioc'
import { GitRender } from './git-render.service'

interface PostBody {
  source: string
  sourceType: 'GIT' | 'LOCAL'
  template: {
    data: any
  }
}

@Route('/render')
export class HelloController extends Controller {
  @Inject private gitRenderService: GitRender

  @SuccessResponse('200', 'Success') // Custom success response
  @Post('/')
  public async render(@Body() json: PostBody): Promise<string> {
    let service: FSWorkspace

    if (json.sourceType === 'GIT') {
      service = this.gitRenderService.getWorkspace(
        json.source,
        './template-tmp/',
        './template-tmp-output/'
      )
    } else {
      service = new FSWorkspace(
        json.source,
        './template-tmp/',
        './template-tmp-output/'
      )
    }

    await service.render(
      {
        data: json.template.data
      },
      new HandlebarsProcessor()
    )

    return ''
  }
}
