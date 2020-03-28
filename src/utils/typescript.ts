import {
  VDir,
  VPackageJson,
  VConfigFile,
  VConfigType,
  PatchStrategy,
} from 'puggle'
import { readResource } from './vfile'

export async function addTypescript(root: VDir, npm: VPackageJson) {
  await npm.addLatestDevDependencies({
    typescript: '^3.x',
    'ts-node': '^8.x',
    '@types/node': '^11.x',
  })

  root.addChild(
    new VConfigFile(
      'tsconfig.json',
      VConfigType.json,
      JSON.parse(await readResource('tsconfig.json')),
      { strategy: PatchStrategy.persist }
    )
  )

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    build: 'tsc',
    lint: 'tsc --noEmit',
  })
}
