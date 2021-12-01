import { Readable } from 'stream'

export async function* concatStreams(...readables: Readable[]) {
  for (const readable of readables) {
    for await (const chunk of readable) {
      yield chunk
    }
  }
}
