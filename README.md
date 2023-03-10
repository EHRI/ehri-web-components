# EHRI Web Components

A set of web components for embedding info derived from the [EHRI Portal](https://portal.ehri-project.eu/) into web
pages.

Example:

```html
<script src="ehri-web-components.js"></script>

<h1>Info about an institution:</h1>
<ehri-item item-id="us-005578"></ehri-item>
```

Currently, the following item types are supported:

* [Archival Institutions](https://portal.ehri-project.eu/institutions)
* [Archival Descriptions](https://portal.ehri-project.eu/units)
* [Authorities (People, Corporate Bodies etc)](https://portal.ehri-project.eu/sets)
* [Country Reports](https://portal.ehri-project.eu/countries)

NB: this library is at a very early stage and probably has numerous bugs and issues.

Building
========

```shell
npm install
npm run build
```

To develop you can use the following to rebuild on file changes:

```shell
npm run serve
```

