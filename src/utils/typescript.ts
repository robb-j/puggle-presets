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
    typescript: '^4.x',
    'ts-node': '^10.x',
    '@types/node': '^14.x',
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
