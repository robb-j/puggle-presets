import dedent = require('dedent')
import { PatchStrategy, VDir, VFile, VPackageJson } from 'puggle'

const cliTs = (name: string) => dedent`
  #!/usr/bin/env node

  //
  // The cli entrypoint
  //

  import yargs = require('yargs')
  
  yargs.help().alias('h', 'help').demandCommand().recommendCommands()

  yargs.command(
    'example',
    'A placeholder command',
    (yargs) => yargs,
    async (args) => {
      console.log(args)
    }
  )

  yargs.parse()
`

export async function useCli(
  root: VDir,
  npm: VPackageJson,
  packageName: string,
  usingDocker: boolean,
  usingTypescript: boolean
) {
  await npm.addLatestDependencies({
    yargs: '17.x',
  })

  await npm.addLatestDevDependencies({
    '@types/yargs': '17.x',
  })

  const extension = usingTypescript ? 'ts' : 'js'
  const entrypoint = `cli.${extension}`
  const args = '-r ts-node/register -r dotenv/config'

  npm.addPatch('scripts', PatchStrategy.placeholder, {
    start: `node ${args} src/${entrypoint}`,
    debug: `node --inspect-brk ${args} src/${entrypoint}`,
  })

  const src = root.find('src') as VDir
  src.addChild(new VFile(entrypoint, cliTs(packageName)))

  if (usingDocker) {
    const dockerfile = root.find('Dockerfile') as VFile
    dockerfile.contents = dockerfile.contents.replace(
      `"dist/index.js"`,
      `"dist/cli.js"`
    )
  }
}
