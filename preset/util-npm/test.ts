import { findLatestVersion } from './index'
import Table from 'cli-table'

//
// Testing entrypoint
//
;(async () => {
  const data = [
    ['9.6.0', 'got'],
    ['^9', 'got'],
    ['~9.5', 'got'],
    ['9', 'got'],
    ['9.x.x', 'got'],
    ['9.5.x', 'got']
  ]

  const table = new Table({
    head: ['package', 'match', 'result']
  })

  for (let [range, name] of data) {
    table.push([name, range, await findLatestVersion(name, range)])
  }

  console.log(table.toString())
})()
