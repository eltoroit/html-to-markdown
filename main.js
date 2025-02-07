import { Application, Router } from "jsr:@oak/oak";

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = `
<!DOCTYPE html>
<html>
  <head><title>Agentforce PTO</title><head>
  <body>
    <h1>Agentforce PTO</h1>
  </body>
</html>`;
});

router.post("/convert", async (ctx) => {
  try {
    const body = await ctx.request.body.text();

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Missing request body",
      };
      return;
    }

    const markdown = `Pong: ${body}`;

    ctx.response.body = markdown;
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
app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") || "3000");
app.listen({ port });
console.log(`Server running on port ${port}: http://localhost:${port}`);

// // CORS middleware
// app.use(async (ctx, next) => {
//   ctx.response.headers.set("Access-Control-Allow-Origin", "*");
//   ctx.response.headers.set(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS"
//   );
//   ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

//   if (ctx.request.method === "OPTIONS") {
//     ctx.response.status = 204;
//     return;
//   }

//   await next();
// });
