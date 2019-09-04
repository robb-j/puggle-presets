import got from 'got'
import semver from 'semver'

const REGISTRY_URL = 'https://registry.npmjs.org/'

export async function findLatestVersion(
  packageName: string,
  semverRange: string
): Promise<string> {
  try {
    //
    // 1. Fetch the package info from the npm registry
    //
    const npmPackage = await got(REGISTRY_URL + packageName, { json: true })

    //
    // 2. Get the versions and filter out the ones that don't match our range
    //
    const allMatches = Object.keys(npmPackage.body.versions).filter(version =>
      semver.satisfies(version, semverRange)
    )

    //
    // 3. Fail if there were no matches
    //
    if (allMatches.length === 0) {
      throw new Error()
    }

    //
    // 4. Sort the matches largest first, to get the largest one
    //
    allMatches.sort((a, b) => {
      if (semver.eq(a, b)) return 0
      else if (semver.gt(a, b)) return -1
      else return 1
    })

    //
    // 5. Return the largest semver
    //
    return allMatches[0]
  } catch (error) {
    throw new Error(`Unable match '${semverRange}' for '${packageName}'`)
  }
}
