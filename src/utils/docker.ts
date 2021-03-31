import { PatchStrategy, VDir, VIgnoreFile } from 'puggle'
import { readVFile } from './vfile'

export async function addDocker(root: VDir, options: any, toIgnore: string[]) {
  root.addChild(
    await readVFile('Dockerfile', 'docker/ts.Dockerfile'),
    new VIgnoreFile(
      '.dockerignore',
      'Files to ignore from the docker daemon',
      toIgnore,
      PatchStrategy.persist
    )
  )
}
