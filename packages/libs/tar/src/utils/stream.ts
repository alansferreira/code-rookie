import { PassThrough } from 'stream'
export const merge = (...streams) => {
  let pass = new PassThrough()
  let waiting = streams.length
  for (const stream of streams) {
    pass = stream.pipe(pass, { end: false })
    stream.on('end', () => --waiting === 0 && pass.emit('end'))
  }
  return pass
}

export async function* concatStreams(...readables) {
  for (const readable of readables) {
    for await (const chunk of readable) {
      yield chunk
    }
  }
}
