# DENO

- Add dependencies
  - `deno add jsr:@oak/oak`
  - `deno add npm:turndown`
  - https://deno.land/x/google_api@v1.2
- Install
  - `deno install`
- run App
  - `deno run --allow-env --allow-net ./main.js`

# WEB SERVER

- https://docs.deno.com/runtime/fundamentals/http_server/ recommends using Oak https://jsr.io/@oak/oak

# HEROKU

- `heroku create --buildpack https://github.com/chibat/heroku-buildpack-deno.git`
- Procfile: `web: deno run --allow-env --allow-net ./main.js`

# Certs

```
openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <( printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```
