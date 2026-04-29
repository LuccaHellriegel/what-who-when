.PHONY: dev lint test build pages publish-pages

dev:
	npm run dev

lint:
	npm run lint

test:
	npm run test

build:
	npm run build

pages:
	npm run build:pages
	touch docs/.nojekyll

publish-pages: pages
	git add docs
	git diff --cached --quiet -- docs || git commit -m "Build GitHub Pages assets" -- docs
