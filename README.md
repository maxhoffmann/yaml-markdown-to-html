transform-yaml-markdown [![version][1]][2] [![build][3]][4]
=======================

transform a folder of markdown files with yaml frontmatter to html

Installation
------------

```bash
npm i transform-yaml-markdown
```

Usage
-----

```bash
transform-yaml-markdown <source> <destination> <render> [postRender]
```

The `render` and `postRender` functions are exported common.js functions.

`render` gets a `data` object passed with all meta data and markdown from the current file. It should return a Promise that fulfills with the rendered HTML. An example function can be found in the `test` folder.

`postRender` receives the paths and the data of all rendered html files and should return a Promise that fulfills after a certain build step.

LICENSE
-------

The MIT License (MIT) Maximilian Hoffmann

[1]: http://img.shields.io/npm/v/transform-yaml-markdown.svg?style=flat
[2]: https://www.npmjs.org/package/transform-yaml-markdown
[3]: http://img.shields.io/travis/maxhoffmann/transform-yaml-markdown.svg?style=flat
[4]: https://travis-ci.org/maxhoffmann/transform-yaml-markdown
