import { Application, Router } from "jsr:@oak/oak";
import { convertHtmlToSlack } from "./convertHtmlToSlack.js";

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = `
<!DOCTYPE html>
<html>
  <head><title>HTML 2 Slack Blocks</title><head>
  <body>
    <h1>HTML 2 Slack Blocks</h1>
  </body>
</html>
    `;
});

router.post("/convert", async (ctx) => {
  try {
    const body = await ctx.request.body.text();

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = "Missing request body";
      return;
    }

    ctx.response.body = convertHtmlToSlack(body);
  } catch (error) {
    console.error("Conversion error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to convert HTML to Markdown",
      details: error.message,
    };
  }
});

const app = new Application();
// //#region CORS middleware
// app.use(async (ctx, next) => {
//   ctx.response.headers.set(
//     "Access-Control-Allow-Origin",
//     ctx.request.headers.get("Origin") || "*"
//   );
//   ctx.response.headers.set("Access-Control-Allow-Credentials", true);
//   ctx.response.headers.set(
//     "Access-Control-Allow-Methods",
//     "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS"
//   );
//   ctx.response.headers.set("Access-Control-Expose-Headers", "Content-Length");
//   ctx.response.headers.set(
//     "Access-Control-Allow-Headers",
//     "Accept, Authorization, Content-Type, X-Requested-With, Range"
//   );
//   if (ctx.request.method === "OPTIONS") {
//     ctx.response.status = 204;
//     return;
//   }

//   await next();
// });
// // // From Express
// // _05AllowExpressCORS() {
// //   this.app.use((req, res, next) => {
// //     // console.log("CORS: Web");
// //     res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
// //     res.header("Access-Control-Allow-Credentials", "true");
// //     res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
// //     res.header("Access-Control-Expose-Headers", "Content-Length");
// //     res.header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With, Range");
// //     if (req.method === "OPTIONS") {
// //       return res.sendStatus(200);
// //     } else {
// //       return next();
// //     }
// //   });
// // }
// //#endregion
app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") || "3000");
app.listen({ port });
console.log(`Server running on port ${port}: http://localhost:${port}`);
