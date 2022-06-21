import * as bodyParser from 'body-parser'
import express from 'express'
import { RegisterRoutes } from './.config/routes'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'

export const app: express.Express = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(
  '/docs',
  swaggerUi.serve,
  async (_req: express.Request, res: express.Response) => {
    res.send(
      swaggerUi.generateHTML(
        JSON.parse(readFileSync('../swagger.json').toString())
      )
    )
  }
)

RegisterRoutes(app)

// It's important that this come after the main routes are registered
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status || 500
    const body: any = {
      fields: err.fields || undefined,
      message: err.message || 'An error occurred during the request.',
      name: err.name,
      status
    }
    res.status(status).json(body)
  }
)
