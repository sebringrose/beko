import { 
  Route, 
  ssr, 
  cacher
} from "../../../mod.ts"

import { renderToString } from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string"

// Preact page components and HTML template for ssrHandler render logic
import Home from "../src/pages/Home.js"
import About from "../src/pages/About.js"
import htmlTemplate from "../document.ts"

const env = Deno.env.toObject()

const pages: Route[] = [
  {
    path: "/",
    // use cacher to serve responses from cache in prod env
    middleware: cacher(),
    handler: ssr(() => {
      const appHTML = renderToString(Home(), null, null)
      return htmlTemplate({
        appHTML,
        title: `<title>Peko</title>`,
        modulepreload: `
          <script modulepreload="true" type="module" src="https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string"></script>
          <script modulepreload="true" type="module" src="/pages/Home.js"></script>
        `,
        hydrationScript: `<script type="module">
          import { hydrate } from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string";
          import Home from "/pages/Home.js";
          hydrate(Home(), document.getElementById("root"));
        </script>`
      })
    }, {
      headers: new Headers({
        // instruct browser to cache page in prod env
        "Cache-Control": env.ENVIRONMENT === "production"
          ? "max-age=86400, stale-while-revalidate=86400"
          : "no-store"
      }),
    })
  },
  {
    path: "/about",
    middleware: [
      (ctx) => { 
        ctx.state = {
          request_time: `${Date.now()}`,
          ...Deno.env.toObject()
        }
      }
    ],
    handler: ssr((ctx) => {
      const appHTML = renderToString(About(ctx.state), null, null)
      return htmlTemplate({
        appHTML,
        title: `<title>Peko | About</title>`,
        modulepreload: `
          <script modulepreload="true" type="module" src="https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string"></script>
          <script modulepreload="true" type="module" src="/pages/About.js"></script>
        `,
        hydrationScript: `<script type="module">
          import { hydrate } from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,preact-render-to-string";
          import About from "/pages/About.js";
          hydrate(About(${JSON.stringify(ctx.state)}), document.getElementById("root"))
        </script>`
      })
    })
  }
]

export default pages