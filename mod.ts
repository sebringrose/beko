/**
 * Featherweight HTTP routing and utils for apps on the edge.
 */

// Core classes, functions & types
export * from "./lib/Router.ts"
export * from "./lib/types.ts"

// Handlers
export * from "./lib/handlers/static.ts"
export * from "./lib/handlers/ssr.ts"
export * from "./lib/handlers/sse.ts"

// Middlewares
export * from "./lib/middleware/logger.ts"
export * from "./lib/middleware/cacher.ts"
export * from "./lib/middleware/authenticator.ts"

// Utils
export * from "./lib/utils/Cascade.ts"
export * from "./lib/utils/Crypto.ts"
export * from "./lib/utils/helpers.ts"

import { Router } from "./lib/Router.ts"
export default Router