import { createLogger, transports } from 'winston'

export function logger() {
  return createLogger({
    transports: [new transports.Console()]
  })
}
