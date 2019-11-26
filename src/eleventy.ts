import { presetify, npmPlugin, VPackageJson, PatchStrategy } from 'puggle'
import { addPrettier } from './utils/prettier'
import { addEslint } from './utils/eslint'

export default presetify({
  name: 'robb-j:eleventy',
  version: '0.1.0',

  plugins: [npmPlugin],

  async apply(root, {}) {
    let npm = VPackageJson.getOrFail(root)

    //
    // Add prettier
    //
    addPrettier(root, npm, 'js,jsx,ts,tsx,json,css,md,scss')

    //
    // Add eslint
    //
    addEslint(root, npm)

    //
    // Setup generator
    //
    await npm.addLatestDependencies({
      '@11ty/eleventy': '^0.9.x',
      '@babel/core': '^7.x',
      '@babel/plugin-transform-react-jsx': '^7.x',
      '@babel/preset-env': '^7.x',
      '@fortawesome/fontawesome-svg-core': '^1.x',
      '@fortawesome/free-brands-svg-icons': '^5.x',
      '@fortawesome/free-regular-svg-icons': '^5.x',
      '@fortawesome/free-solid-svg-icons': '^5.x',
      bulma: '^0.8.x',
      dotenv: '^8.x',
      'markdown-it': '^10.x',
      'markdown-it-anchor': '^5.x',
      'npm-run-all': '^4.x',
      'parcel-bundler': '^1.x',
      sass: '^1.x',
      slugify: '^1.x'
    })

    npm.addPatch('scripts', PatchStrategy.persist, {
      serve: 'run-p serve:eleventy serve:parcel',
      'serve:eleventy': 'eleventy --serve',
      'serve:parcel': 'parcel serve --no-hmr src/{index.js,styles.scss}',
      build: 'run-s build:parcel build:eleventy',
      'build:eleventy': 'eleventy',
      'build:parcel':
        'parcel build src/{index.js,styles.scss} --experimental-scope-hoisting'
    })

    //
    // Setup template
    //
  }
})
