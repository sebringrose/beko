import React from "https://esm.sh/react@18.2.0";
import { renderToReadableStream } from "https://esm.sh/react-dom@18.2.0/server";
import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";
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
  (path) => ({
    path,
    middleware: kvCache,
    handler: async () => {
      const bundle = await esbuild.build({
        entryPoints: [`.${path}`],
        platform: "browser",
        target: ["chrome99", "firefox99", "safari15"],
        format: "esm",
        bundle: true,
        splitting: true,
        treeShaking: true,
        sourcemap: "linked",
        jsx: "transform",
        absWorkingDir: Deno.cwd(),
        outdir: ".",
        write: false,
        metafile: true,
        plugins: [...denoPlugins()]
      })

      //console.log(bundle)

      return new Response(bundle.outputFiles[1].contents, {
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