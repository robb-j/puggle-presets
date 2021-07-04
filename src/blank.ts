import dedent = require('dedent')
import {
  PatchStrategy,
  presetify,
  VConfigFile,
  VConfigType,
  VFile,
} from 'puggle'
import { readVFile } from './utils'

export default presetify({
  name: 'robb-j:blank',
  version: '0.1.0',

  plugins: [],

  async apply(root, { targetName, askQuestions }) {
    //
    // Setup editorconfig
    //
    root.addChild(
      await readVFile('.editorconfig', '.editorconfig', PatchStrategy.persist)
    )

    //
    // Add a .prettierrc to enable IDE formatting
    //
    root.addChild(
      new VConfigFile('.prettierrc', VConfigType.json, {
        semi: false,
        singleQuote: true,
      })
    )

    //
    // Add a README.md
    //
    root.addChild(
      new VFile(
        'README.md',
        dedent`
        # ${targetName}
        
        ---
      
        > This project was set up by [puggle](https://npm.im/puggle)
      `
      )
    )
  },
})
