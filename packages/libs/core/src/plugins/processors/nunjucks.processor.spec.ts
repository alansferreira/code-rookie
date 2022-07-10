import { NunjucksProcessor } from './nunjucks.processor'

describe('Handlebars template processor', () => {
  const hb = new NunjucksProcessor()
  test('sample template processing', async () => {
    const r = await hb.render(
      { data: { teste: 'hello' } },
      { input: Buffer.from('{{teste}}') }
    )
    expect(r.output.toString()).toEqual('hello')
  })
})
