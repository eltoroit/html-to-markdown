# DENO

- Add dependencies
  - `deno add jsr:@oak/oak`
  - `deno add npm:turndown`
- Install
  - `deno install`
- run App
  - `deno run --allow-env --allow-net ./main.js`

# WEB SERVER

- https://docs.deno.com/runtime/fundamentals/http_server/ recommends using Oak https://jsr.io/@oak/oak

# HEROKU

- `heroku create --buildpack https://github.com/chibat/heroku-buildpack-deno.git`
- Procfile: `web: deno run --allow-env --allow-net ./main.js`
