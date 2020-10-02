import {
  presetify,
  npmPlugin,
  VPackageJson,
  PatchStrategy,
  VIgnoreFile,
  VFile,
  VDir,
} from 'puggle'
import dedent = require('dedent')

import { addJestWithTypescript } from './utils/jest'
import { addTypescript } from './utils/typescript'
import { addPrettier } from './utils/prettier'
import { readVFile, readResource } from './utils/vfile'

const readme = (name: string) => dedent`
  # ${name}
  
  Coming soon...
  
  ---
  
  > This project was set up by [puggle](https://npm.im/puggle)
`

const typesTs = dedent`
  import { BaseContext } from '@robb_j/chowchow'
  import { LoggerContext } from '@robb_j/chowchow-logger'
  import { JsonEnvelopeContext } from '@robb_j/chowchow-json-envelope'

  export type Context = BaseContext &
    LoggerContext &
    JsonEnvelopeContext
`

const routesIndex = dedent`
  export { default as hello } from './hello-route'
`

const helloRoute = dedent`
  import { Context } from '../../types'

  export default async ({ sendData }: Context) => {
    sendData({ message: 'Hello, World!' })
  }
`

const helloRouteSpec = dedent`
  import { MockChowChow, setupServer } from '../../../utils/test-harness'

  describe('GET: /', () => {
    let chow: MockChowChow

    beforeEach(async () => {
      chow = setupServer(new MockChowChow())
      await chow.start()
    })

    afterEach(async () => {
      await chow.stop()
    })

    it('should return a http/200', async () => {
      let res = await chow.agent.get('/')
      expect(res.status).toEqual(200)
    })
  })
`

const toIgnore = ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist']

export default presetify({
  name: 'robb-j:chowchow',
  version: '0.1.0',

  plugins: [npmPlugin],

  async apply(root, { targetName }) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Setup testing
    //
    await addJestWithTypescript(root, npm)

    //
    // Setup typescript
    //
    await addTypescript(root, npm)

    //
    // Setup prettier
    //
    await addPrettier(root, npm, 'js,json,css,md,ts,tsx')

    //
    // Setup docker
    //
    root.addChild(
      await readVFile('Dockerfile', 'docker/ts.Dockerfile'),
      new VIgnoreFile(
        '.dockerignore',
        'Files to ignore from the docker daemon',
        toIgnore,
        PatchStrategy.persist
      )
    )

    //
    // Setup git
    //
    root.addChild(
      new VIgnoreFile(
        '.gitignore',
        'Files to ignore from git source control',
        ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist'],
        PatchStrategy.persist
      )
    )

    //
    // Setup editorconfig
    //
    root.addChild(
      new VFile(
        '.editorconfig',
        await readResource('.editorconfig'),
        PatchStrategy.persist
      )
    )

    //
    // Setup template
    //
    const [testHarnessTs, serverTs, cliTs] = await Promise.all([
      readResource('chowchow/test-harness.ts'),
      readResource('chowchow/server.ts'),
      readResource('chowchow/cli.ts'),
    ])

    await npm.addLatestDependencies({
      '@robb_j/chowchow': '^0.x',
      '@robb_j/chowchow-json-envelope': '^0.x',
      '@robb_j/chowchow-logger': '^0.x',
      cors: '^2.x',
      dotenv: '^8.x',
      'valid-env': '^1.x',
      yargs: '^14.x',
    })

    await npm.addLatestDevDependencies({
      '@types/cors': '^2.8.6',
      '@types/express': '^4.17.1',
      '@types/supertest': '^2.0.8',
      '@types/yargs': '^13.0.2',
      nodemon: '^1.19.2',
      supertest: '^4.0.2',
    })

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s && npm run build',
      postversion: 'git push --follow-tags',
      'cli:dev': 'node -r dotenv/config -r ts-node/register src/cli.ts',
      'cli:prod': 'node dist/cli.js',
      start: 'npm run cli:prod -s server',
    })

    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VFile('server.ts', serverTs),
        new VFile('cli.ts', cliTs),
        new VFile('types.ts', typesTs),
        new VDir('utils', [new VFile('test-harness.ts', testHarnessTs)]),
        new VDir('routes', [
          new VDir('general', [
            new VFile('index.ts', routesIndex),
            new VFile('hello-route.ts', helloRoute),
            new VDir('__test__', [
              new VFile('hello-route.spec.ts', helloRouteSpec),
            ]),
          ]),
        ]),
      ])
    )
  },
})
