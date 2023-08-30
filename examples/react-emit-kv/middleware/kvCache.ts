import { cacher } from "../../../mod.ts"

const kv = await Deno.openKv();

// wipe kv when app starts (delete for prod)
for await (const item of kv.list({ prefix: ["cache-items"] })) {
  kv.delete(item.key)
}

interface ResponseObj {
  body: string
  status: number
  statusText: string
  headers: string[][]
}

export const kvCache = cacher({
  itemLifetime: 10000,
  store: {
    get: async (key) => {
      const node = (await kv.get<ResponseObj>(["cache-items", key])).value
      if (node) {
        const headers = new Headers()
        node.headers.forEach((entry: string[]) => headers.set(entry[0], entry[1]))

        return new Response((await fetch(node.body)).body, {
          status: node.status,
          statusText: node.statusText,
          headers
        })
      }
    },
    set: async (key, response) => {
      const reader = new FileReader()
      const bodyBlob = await response.blob()
      reader.readAsDataURL(bodyBlob)

      const bodyDataURL: string = await new Promise(res => {
        reader.addEventListener("load", () => {
          res(reader.result as string);
        });
      })

      const node = {
        body: bodyDataURL,
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()]
      }

      return await kv.set(["cache-items", key], node)
    },
    delete: (key) => kv.delete(["cache-items", key])
  }
});