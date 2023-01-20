# EHRI Web Components

A set of web components for embedding info derived from the [EHRI Portal](https://portal.ehri-project.eu/) into web
pages.

Example:

```html
<script src="dist/ehri-web-components.js"></script>

<h1>Info about an institution:</h1>
<ehri-item id="us-005578"></ehri-item>
```

Currently the following item types are supported:

* [Archival Institutions](https://portal.ehri-project.eu/institutions)
* [Archival Descriptions](https://portal.ehri-project.eu/units)
* [Authorities (People, Corporate Bodies etc)](https://portal.ehri-project.eu/sets)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

