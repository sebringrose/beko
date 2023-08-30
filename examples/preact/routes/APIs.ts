import { 
  RequestContext, 
  Route,
  sse
} from "../../../mod.ts"

const demoEventTarget = new EventTarget()
setInterval(() => {
  demoEventTarget.dispatchEvent(new CustomEvent("send", { detail: Math.random() }))
}, 2500)

const APIs: Route[] = [
  {
    path: "/sse",
    handler: sse(demoEventTarget)
  },
  {
    path: "/api/parrot",
    method: "POST",
    handler: async (ctx: RequestContext) => {
      const body = await ctx.request.text()
      return new Response(`Parrot sqwarks: ${body}`)
    }
  }
]

export default APIs