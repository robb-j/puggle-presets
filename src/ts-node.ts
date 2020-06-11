import {
  Preset,
  VDir,
  VFile,
  VIgnoreFile,
  VPackageJson,
  trimInlineTemplate,
  npmPlugin,
  PatchStrategy,
  presetify,
} from 'puggle'

import { addPrettier } from './utils/prettier'
import { addTypescript } from './utils/typescript'
import { readVFile, readResource } from './utils/vfile'
import { addJestWithTypescript } from './utils/jest'

const indexTs = (name: string) => trimInlineTemplate`
  // 
  // The app entrypoint
  // 
  
  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecTs = () => trimInlineTemplate`
  //
  // An example unit test
  //

  describe('sample', () => {
    it('should pass', () => {
      expect(1 + 1).toBe(2)
    })
  })
`

const readme = (name: string) => trimInlineTemplate`
  # ${name}
  
  Coming soon...
  
  ---
  
  > This project was set up by [puggle](https://npm.im/puggle)
`

const toIgnore = ['*.env', '.DS_Store', 'node_modules', 'coverage', 'dist']

export default presetify({
  name: 'robb-j:ts-node',
  version: '0.2.2',

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
    //  Setup prettier
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
        toIgnore,
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
    await npm.addLatestDependencies({
      dotenv: '8.x',
    })

    await npm.addLatestDevDependencies({
      nodemon: '2.x',
    })

    npm.addPatch('main', PatchStrategy.placeholder, 'dist/index.js')
    npm.addPatch('types', PatchStrategy.placeholder, 'dist/index.d.js')

    npm.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s && npm run build',
      start: 'node -r dotenv/config dist/index.js',
      dev:
        "nodemon -w src -e ts -x 'npx ts-node -r dotenv/config' src/index.ts",
    })

    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VFile('.env', 'NODE_ENV=development'),
      new VDir('src', [
        new VFile('index.ts', indexTs(targetName)),
        new VDir('__test__', [new VFile('index.spec.ts', indexSpecTs())]),
      ])
    )
  },
})
