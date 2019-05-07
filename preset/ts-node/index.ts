import {
  Preset,
  PluginArgs,
  VDir,
  VFile,
  VIgnoreFile,
  trimInlineTemplate,
  JestPlugin,
  NpmPlugin,
  PrettierPlugin,
  VPackageJson,
  TypeScriptPlugin
} from 'puggle'

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

module.exports = class RobbJTsNodePreset implements Preset {
  title = 'robb-j:ts-node'
  version = '0.0.0'

  plugins = [
    new NpmPlugin(),
    new TypeScriptPlugin(),
    new JestPlugin(),
    new PrettierPlugin()
  ]

  async extendVirtualFileSystem(root: VDir, { projectName }: PluginArgs) {
    let npmPackage = VPackageJson.getPackageOrFail(root)

    //
    // Tweak the package.json
    //
    npmPackage.dependencies['dotenv'] = '^7.0.0'
    npmPackage.devDependencies['nodemon'] = '^1.18.10'

    npmPackage.values['main'] = 'dist/index.js'
    npmPackage.values['types'] = 'dist/index.d.js'

    npmPackage.scripts['preversion'] = 'npm run test -s && npm run build'
    npmPackage.scripts['start'] = 'node -r dotenv/config dist/index.js'
    npmPackage.scripts[
      'dev'
    ] = `NODE_ENV=development nodemon -w src -e ts -x 'npx ts-node -r dotenv/config' src/index.ts`

    //
    // Add extra files
    //
    root.addChild(
      new VFile('README.md', readme(projectName)),
      new VDir('src', [
        new VFile('index.ts', indexTs(projectName)),
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
}