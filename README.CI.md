+Pequena documentação das ferramentas adicionadas:
+- ESLint: lint básico para JavaScript.
+- Prettier: formatação de código.
+- Vitest: runner de testes unitários.
+- GitHub Actions: workflow de CI (lint + format check + testes).
+
+Para rodar local:
+- npm ci
+- npm run lint
+- npm run format:check
+- npm test
+
*** End Patch

*** Begin Patch
*** Update File: package.json
@@
 {

"name": "projeto-examecare",
"version": "1.0.0",
"description": "",
"main": "index.js",
"scripts": {
"test": "echo "Error: no test specified" && exit 1"
},
"keywords": [],
"author": "",
"license": "ISC"
"name": "projeto-examecare",
"version": "1.0.0",
"description": "",
"main": "index.js",
"scripts": {
"lint": "eslint . --ext .js,.ts",
"format": "prettier --write .",
"format:check": "prettier --check .",
"test": "vitest --run",
"test:watch": "vitest"
},
"keywords": [],
"author": "",
"license": "ISC",
"devDependencies": {
"eslint": "^8.50.0",
"prettier": "^2.10.0",
"vitest": "^1.3.0"
} } *** End Patch
