import fs from "fs"
import noblox from "noblox.js"

const DEFAULT_GROUP_ID = 35138034

function parseRole(value) {
  // Accept number or string from JSON
  // If numeric-like string, convert to number; else leave as string for role name
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = Number(value)
    if (!Number.isNaN(n) && value.trim() !== "") return n
    return value // role name as string
  }
  // If it’s an object (Role), we’ll just pass it through (advanced usage)
  return value
}

async function main() {
  const cookie = process.env.ROBLOSECURITY
  if (!cookie) {
    console.error("Missing ROBLOSECURITY environment variable. Add it in GitHub Secrets.")
    process.exit(1)
  }

  try {
    const me = await noblox.setCookie(cookie)
    console.log(`Logged in as ${me.UserName} [${me.UserID}]`)
  } catch (err) {
    console.error("Failed to authenticate with Roblox:", err?.message || err)
    process.exit(1)
  }

  const queuePath = process.env.QUEUE_FILE || "ranks.json"
  if (!fs.existsSync(queuePath)) {
    console.log("No ranks.json found; nothing to do.")
    return
  }

  const raw = fs.readFileSync(queuePath, "utf8").trim()
  if (!raw) {
    console.log("ranks.json is empty; nothing to do.")
    return
  }

  let jobs
  try {
    jobs = JSON.parse(raw)
  } catch (e) {
    console.error("ranks.json is not valid JSON:", e?.message || e)
    process.exit(1)
  }

  if (!Array.isArray(jobs)) {
    console.error("ranks.json must be an array of { userId, role, groupId? } objects.")
    process.exit(1)
  }

  let success = 0
  let fail = 0

  for (const job of jobs) {
    const gid = Number(job.groupId ?? DEFAULT_GROUP_ID)
    const uid = Number(job.userId)
    const role = parseRole(job.role)

    if (!Number.isInteger(uid)) {
      console.error("Invalid job (userId must be integer):", job)
      fail++
      continue
    }
    if (!Number.isInteger(gid)) {
      console.error("Invalid job (groupId must be integer):", job)
      fail++
      continue
    }
    if (role === undefined || role === null || role === "") {
      console.error("Invalid job (role missing). Provide rank number, rolesetId, or role name string:", job)
      fail++
      continue
    }

    try {
      // setRank(group, target, rank) 🔐
      const result = await noblox.setRank(gid, uid, role)
      // result is a Role object representing the new role
      console.log(`OK user ${uid} in group ${gid}: set to role "${result?.name}" [rank ${result?.rank}] rolesetId ${result?.id}`)
      success++
    } catch (err) {
      console.error(`FAIL user ${uid} in group ${gid}: ${err?.message || err}`)
      fail++
    }
  }

  console.log(`Done. Success: ${success}, Fail: ${fail}`)
}

main().catch(err => {
  console.error("Fatal error:", err?.message || err)
  process.exit(1)
})
