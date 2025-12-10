// uses noblox | https://noblox.js.org/index.html
import noblox from "noblox.js"

const DEFAULT_GROUP_ID = 35138034

function parseRole(value) {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    const maybeNum = Number(trimmed)
    if (!Number.isNaN(maybeNum)) return maybeNum
    return trimmed
  }
  return value
}

async function main() {
  const cookie = process.env.ROBLOSECURITY
  if (!cookie) {
    console.error("Missing ROBLOSECURITY environment variable (add to GitHub Secrets).")
    process.exit(1)
  }
  const userIdRaw = process.env.INPUT_USER_ID
  const roleRaw = process.env_INPUT_ROLE
  const groupIdRaw = process.env.INPUT_GROUP_ID

  if (!userIdRaw || !roleRaw) {
    console.error("Missing required inputs: userId and role.")
    process.exit(1)
  }

  const userId = Number(userIdRaw)
  const groupId = groupIdRaw ? Number(groupIdRaw) : DEFAULT_GROUP_ID
  const role = parseRole(roleRaw)

  if (!Number.isInteger(userId)) {
    console.error("userId must be an integer.")
    process.exit(1)
  }
  if (!Number.isInteger(groupId)) {
    console.error("groupId must be an integer.")
    process.exit(1)
  }
  if (role === undefined || role === null || role === "") {
    console.error("role must be provided (role name, rank number 0–255, or rolesetId >255).")
    process.exit(1)
  }

  try {
    const me = await noblox.setCookie(cookie)
    console.log(`Logged in as ${me.UserName} [${me.UserID}]`)
  } catch (err) {
    console.error("Failed to authenticate with Roblox:", err?.message || err)
    process.exit(1)
  }

  try {
    // setRank(group, target, rank) 🔐
    const result = await noblox.setRank(groupId, userId, role)
    console.log(`OK: user ${userId} in group ${groupId} set to role "${result?.name}" (rank ${result?.rank}, rolesetId ${result?.id})`)
  } catch (err) {
    console.error(`FAIL: user ${userId} in group ${groupId}: ${err?.message || err}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error("Fatal:", err?.message || err)
  process.exit(1)
})
