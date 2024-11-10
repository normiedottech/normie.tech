// app/utils/getBootstrapData.js
import { PostHog } from 'posthog-node'
import { cookies } from 'next/headers'
import { generateId } from './get-id'

export async function getBootstrapData() {
  let distinct_id = ''
  const phProjectAPIKey = 'phc_AwsxaP902GDQRKyU0jTi9edD5ekDDA3opoGTSyFuCMV'
  const phCookieName = `ph_${phProjectAPIKey}_posthog`
  const cookieStore = cookies()
  const phCookie = cookieStore.get(phCookieName)

  if (phCookie) {
    const phCookieParsed = JSON.parse(phCookie.value);
    distinct_id = phCookieParsed.distinct_id;
  }
  if (!distinct_id) {
    distinct_id = generateId()
  }

  const client = new PostHog(
    phProjectAPIKey,
    { host: "https://us.i.posthog.com" })
  const flags = await client.getAllFlags(distinct_id)
  const bootstrap = {
    distinctID: distinct_id,
    featureFlags: flags
  }

  return bootstrap
}