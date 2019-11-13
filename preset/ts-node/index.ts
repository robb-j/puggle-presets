import {
  Preset,
  VDir,
  VFile,
  VIgnoreFile,
  VPackageJson,
  trimInlineTemplate,
  jestPlugin,
  npmPlugin,
  prettierPlugin,
  eslintPlugin,
  dockerPlugin,
  gitPlugin,
  typescriptPlugin,
  PatchStrategy
} from 'puggle'

const pluginPackage = require('./package.json')

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

const editorconfig = () => trimInlineTemplate`
  #
  # Editor config, for sharing IDE preferences (https://editorconfig.org)
  #
  
  root = true

  [*]
  charset = utf-8
  indent_style = space
  indent_size = 2
  end_of_line = lf
  insert_final_newline = true
`

const readme = (name: string) => trimInlineTemplate`
  # ${name}
  
  Coming soon...
  
  ---
  
  > This project was set up by [puggle](https://npm.im/puggle)
`

module.exports = {
  name: 'robb-j:ts-node',
  version: pluginPackage.version,

  plugins: [
    gitPlugin,
    npmPlugin,
    dockerPlugin,
    jestPlugin,
    prettierPlugin,
    typescriptPlugin
  ],

  async apply(root, { targetName }) {
    let npmPackage = VPackageJson.getOrFail(root)

    npmPackage.addLatestDependencies({
      dotenv: '^8.0.0'
    })
    npmPackage.addLatestDevDependencies({
      nodemon: '^1.19.1'
    })

    npmPackage.addPatch('main', PatchStrategy.placeholder, 'dist/index.js')
    npmPackage.addPatch('types', PatchStrategy.placeholder, 'dist/index.d.js')

    npmPackage.addPatch('scripts', PatchStrategy.placeholder, {
      preversion: 'npm run test -s && npm run build',
      start: 'node -r dotenv/config dist/index.js',
      dev:
        "NODE_ENV=development nodemon -w src -e ts -x 'npx ts-node -r dotenv/config' src/index.ts"
    })

    root.addChild(
      new VFile('README.md', readme(targetName)),
      new VDir('src', [
        new VFile('index.ts', indexTs(targetName)),
        new VDir('__test__', [new VFile('index.spec.ts', indexSpecTs())])
      ]),
      new VFile('.editorconfig', editorconfig()),
      new VIgnoreFile('.gitignore', 'Ignore files from git source control', [
        'dist',
        'node_modules',
        'coverage',
        '*.env',
        '.DS_Store'
      ])
    )
  }
} as Preset
