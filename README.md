# what-who-when

React TypeScript SPA initialized with Vite. The app includes Framer Motion,
Vitest, React Testing Library, ESLint, and Make targets for the common workflow.

## Commands

```sh
make dev
make lint
make test
make build
make pages
make publish-pages
```

`make build` writes the regular production bundle to `dist/`.

`make pages` writes the GitHub Pages bundle to `docs/` with the `/what-who-when/`
base path and adds `docs/.nojekyll`.

`make publish-pages` rebuilds `docs/`, stages only the generated Pages assets,
and commits them with the message `Build GitHub Pages assets`.

## GitHub Pages

In the repository settings, configure GitHub Pages to deploy from the main branch
and the `/docs` folder.

## Soundtrack

https://www.youtube.com/watch?v=DAugeVmr3rM&t=40s

Play in a loop: right click on video and "loop".
