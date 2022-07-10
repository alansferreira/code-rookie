import { logger } from '.'

describe('Utility functions', () => {
  test('isMatchGlob', () => {
    const { error, info, debug } = logger()
    error('teste')
    debug('teste')
    info('teste')
    expect(true).toBeTruthy()
  })
})
