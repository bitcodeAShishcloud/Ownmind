/**
 * Retention run. Deletes everything past its date and prints what went.
 *
 * Safe to run as often as you like. Every statement is a delete bounded by a
 * timestamp, so a second run a minute later removes nothing and does not error.
 * That matters because a cron job that can fail on an empty table is a cron job
 * that eventually gets switched off.
 *
 * Scheduled by ownmind-retention.timer. Manual: npm run retention
 */

const { loadEnv } = await import('./load-env.mts')

// Without this, a run from a shell has no OWNMIND_DATA_DIR and would open a
// database in the project directory instead of the real one, deleting nothing
// and reporting success.
loadEnv()

const { runRetention } = await import('../src/lib/retention.ts')

const result = runRetention()

console.log(`[retention] ran at        ${result.ranAt}`)
console.log(`[retention] analytics     ${result.analyticsDeleted} row(s) deleted`)
console.log(`[retention] consent       ${result.consentDeleted} row(s) deleted`)
console.log(`[retention] auth cleanup  ${result.authHousekeeping} row(s) deleted`)
console.log(
  result.analyticsDeleted === 0 && result.consentDeleted === 0 && result.authHousekeeping === 0
    ? '[retention] nothing was past its date'
    : '[retention] done',
)