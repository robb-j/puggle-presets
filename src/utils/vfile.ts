import { trimInlineTemplate, VFile, PatchStrategy } from 'puggle'

import fs = require('fs')
import { join } from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

export async function readResource(path: string) {
  return readFile(join(__dirname, '../../res', path), 'utf8')
}

export async function readVFile(
  name: string,
  path: string,
  strategy = PatchStrategy.placeholder
) {
  return new VFile(name, await readResource(path), strategy)
}
