deno install --allow-scripts=npm:canvas@3.1.0

cp -rf node_modules/.deno/canvas@3.1.0/node_modules node_modules/.deno/canvas@2.11.2/

deno run -A stdio.server.ts
