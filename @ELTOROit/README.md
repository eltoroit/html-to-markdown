# DENO

-   Add dependencies
    -   `deno add jsr:@oak/oak`
    -   `deno add npm:turndown`
    -   https://deno.land/x/google_api@v1.2
-   Install
    -   `deno install`
-   run App
    -   `deno run --allow-env --allow-net ./main.js`

# WEB SERVER

-   https://docs.deno.com/runtime/fundamentals/http_server/ recommends using Oak https://jsr.io/@oak/oak

# HEROKU

-   `heroku create --buildpack https://github.com/chibat/heroku-buildpack-deno.git`
-   Procfile: `web: deno run --allow-env --allow-net ./main.js`

# Certs

```
openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <( printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

# GOOGLE

-   You will get the refresh token ONLY the first time you authorize the app. Revoke permissions here: https://myaccount.google.com/connections

# SALESFORCE

-   Time zones
    ```
    String val = '2025-02-08T12:00:00-06:00';
    DateTime dt = (DateTime)Json.deserialize('"'+val+'"', DateTime.class);
    System.debug('Original time (GMT): ' + dt.formatGmt('yyyy-MM-dd HH:mm:ss'));
    System.debug('Toronto time: ' + dt.format('yyyy-MM-dd HH:mm:ss', 'America/Toronto'));
    System.debug('Los Angeles time: ' + dt.format('yyyy-MM-dd HH:mm:ss', 'America/Los_Angeles'));
    ```
