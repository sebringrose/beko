import React from "https://esm.sh/react@18.2.0";
import { renderToReadableStream } from "https://esm.sh/react-dom@18.2.0/server";
import { bundle } from "https://deno.land/x/emit@0.26.0/mod.ts";
import { 
  Router, 
  ssr, 
  routesFromDir,
  logger
} from "../../mod.ts";
import { loadTasks } from "./middleware/loadTasks.ts";
import { kvCache } from "./middleware/kvCache.ts";

import App from "./src/App.tsx";

const router = new Router();
router.use(logger(console.log))
router.use(async (_, next) => {
  try {
    await next()
  } catch (e) {
    console.log(e)
    return new Response("Uh-oh!", { status: 500 })
  }
})

router.get("/", [kvCache, loadTasks],
  ssr((ctx) => renderToReadableStream(<App tasks={ctx.state.tasks as string[] } />))
);

router.addRoutes(await routesFromDir(
  new URL("./src", import.meta.url), 
  (path, url) => ({
    path,
    middleware: kvCache,
    handler: async () => {
      const { code } = await bundle(url, {
        allowRemote: false
      });
      return new Response(code, {
        headers: {
          "Content-Type": "text/javascript"
        }
      });
    }
  })
));

Deno.serve((req) => router.handle(req));

// const { code } = await bundle(url, {
//   importMap: {
//     imports: {
//       "https://esm.sh/react@18.2.0": ""
//     }
//   }
// });

// const { code } = await bundle(url, {
//   async load(specifier) {
//       return ""
//   },
// });