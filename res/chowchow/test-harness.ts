//
// A version of chowchow for unit testing
//

import * as supertest from 'supertest'
import { ChowChow } from '@robb_j/chowchow'
import { Context } from '../types'

export { setupServer } from '../server'
export * from '../types'

/** A version of ChowChow to be used in automated tests */
export class MockChowChow extends ChowChow<Context> {
  agent = supertest(this.expressApp)

  // Override these to stop it starting an express server
  protected async startServer() {}
  protected async stopServer() {}
}
