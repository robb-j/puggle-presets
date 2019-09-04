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
  EslintPlugin,
  VPackageJson
} from 'puggle'

import { findLatestVersion as pkg } from '@robb_j/puggle-util-npm'

const pluginPackage = require('./package.json')

const indexJs = (name: string) => trimInlineTemplate`
  //
  // The app entrypoint
  //

  ;(async () => {
    console.log('Hello, ${name}!')
  })()
`

const indexSpecJs = () => trimInlineTemplate`
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

module.exports = class RobbJNodePreset implements Preset {
  title = 'robb-j:node'
  version = pluginPackage.version

  plugins = [
    new NpmPlugin(),
    new JestPlugin(),
    new PrettierPlugin(),
    new EslintPlugin()
  ]

  async extendVirtualFileSystem(root: VDir, { projectName }: PluginArgs) {
    let npmPackage = VPackageJson.getPackageOrFail(root)

    //
    // Tweak the package.json
    //
    npmPackage.dependencies['dotenv'] = await pkg('dotenv', '8.x.x')
    // npmPackage.dependencies['dotenv'] = '^8.0.0'
    npmPackage.devDependencies['nodemon'] = await pkg('nodemon', '1.x.x')
    npmPackage.devDependencies['nodemon'] = '^1.19.1'

    npmPackage.values['main'] = 'src/index.js'

    npmPackage.scripts['preversion'] = 'npm run test -s'
    npmPackage.scripts['start'] = 'node -r dotenv/config src/index.js'
    npmPackage.scripts[
      'dev'
    ] = `NODE_ENV=development nodemon -w src -x 'node -r dotenv/config' src/index.js`

    //
    // Add extra files
    //
    root.addChild(
      new VFile('README.md', readme(projectName)),
      new VDir('src', [
        new VDir('__tests__', [new VFile('index.spec.js', indexSpecJs())]),
        new VFile('index.js', indexJs(projectName))
      ]),
      new VFile('.editorconfig', editorconfig()),
      new VIgnoreFile('.gitignore', 'Ignore files from git source control', [
        'node_modules',
        'coverage',
        '*.env',
        '.DS_Store'
      ])
    )
  }
}
