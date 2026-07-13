---
name: Route async-handler convention
description: Express routes without try/catch leave requests hanging on DB errors; use asyncHandler
---
Several server/routes/*.js files had async route handlers with no try/catch and no call to `next(err)`. In
Express 4, a rejected promise from an async handler is never forwarded to the global error middleware
automatically — it becomes an unhandled promise rejection (logged by `process.on('unhandledRejection')` in
server/main.js, not crashing the process, but the HTTP request just hangs forever with no response).

**Why:** discovered via an automated code-quality report; confirmed no built-in Express mechanism catches this.

**How to apply:** wrap any new async route handler lacking its own try/catch with
`asyncHandler` from `server/middleware/asyncHandler.js` — `router.get('/x', asyncHandler(async (req,res)=>{...}))`.
It forwards thrown errors/rejections to the existing global error-handling middleware in server/main.js.
