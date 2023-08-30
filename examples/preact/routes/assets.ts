import {
  staticFiles,
  routesFromDir,
  cacher
} from "../../../mod.ts"

const env = Deno.env.toObject()

const assets = await routesFromDir(new URL(`../src`, import.meta.url), (path, url) => ({
    path: `/${path.slice(path.lastIndexOf("/src" ) + 5)}`,
    middleware: env.ENVIRONMENT === "production" ? cacher() : [],
    handler: staticFiles(url, {
      headers: new Headers({
        "Cache-Control": env.ENVIRONMENT === "production"
          ? "max-age=86400, stale-while-revalidate=604800"
          : "no-store"
      })
    })
  })
)

export default assets
