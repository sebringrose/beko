import { RequestContext, Middleware } from "../../mod.ts";

export type CacheResult = Promise<Response | undefined | null> | Response | undefined | null 

export const defaultKeyGen = (ctx: RequestContext) => {
  const reqURL = new URL(ctx.request.url);
  return `${ctx.request.method}-${reqURL.pathname}${reqURL.search}-${JSON.stringify(ctx.state)}`;
};


interface CacheOptions {
  itemLifetime?: number
  keyGen?: typeof defaultKeyGen
  store?: {
    get: (key: string) => CacheResult
    set: (key: string, response: Response) => Promise<unknown> | unknown
    delete: (key: string) => Promise<unknown> | unknown
  }
}

/**
 * Configurable response cache for router, items stored in memory or via supplied options
 * 
 * ```
 * interface CacheOptions {
 *   itemLifetime?: number
 *   keyGen?: typeof defaultKeyGen
 *   store?: {
 *     get: (key: string) => Promise<CacheItem | undefined> | CacheItem | undefined
 *     set: (key: string, value: CacheItem) => Promise<unknown> | unknown
 *     delete: (key: string) => Promise<unknown> | unknown
 *   }
 * }
 * ```
 * 
 * @param cacheOptions: CacheOptions
 * @returns cacheMiddleware: Middleware
 */
export const cacher = (opts?: CacheOptions): Middleware => {
  const items: Record<string, Response> = {} // default items array

  return async function cacheMiddleware (ctx, next) {
    const key = opts && opts.keyGen 
      ? opts.keyGen(ctx)
      : defaultKeyGen(ctx);

    const cachedResponse = opts && opts.store 
      ? await opts.store.get(key)
      : items[key]

    if (cachedResponse) {
      if (opts && opts.itemLifetime && Date.now() > Number(cachedResponse.headers.get("x-peko-cache")) + opts.itemLifetime) {
        if (opts && opts.store) opts.store.delete(key)
        else delete items[key]
      } else {
        // ETag match triggers 304
        const ifNoneMatch = ctx.request.headers.get("if-none-match")
        const ETag = cachedResponse.headers.get("ETag")
    
        if (ETag && ifNoneMatch?.includes(ETag)) {
          ctx.state.responseFromCache = true
          return new Response(null, {
            headers: cachedResponse.headers,
            status: 304
          })
        }
        
        ctx.state.responseFromCache = true
        const clone = cachedResponse.clone()
        clone.headers.delete("x-peko-cache")
        return clone
      }
    }

    const response = await next()
    if (!response) return

    response.headers.set("x-peko-cache", String(Date.now()))

    opts && opts.store
      ? opts.store.set(key, response.clone())
      : items[key] = response.clone()

    response.headers.delete("x-peko-cache")
    return response.clone()
  }
}