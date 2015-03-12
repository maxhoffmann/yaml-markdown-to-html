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
transform-yaml-markdown <sourceFolder> <destinationFolder> <pathToRenderFunction>
```

The __render function__ is a common.js function, that accepts a data object as an argument
and returns a Promise that should fulfill with the rendered html. An example function can be found in the `test` folder. (it doesn’t render html though)

LICENSE
-------

The MIT License (MIT) Maximilian Hoffmann

[1]: http://img.shields.io/npm/v/transform-yaml-markdown.svg?style=flat
[2]: https://www.npmjs.org/package/transform-yaml-markdown
[3]: http://img.shields.io/travis/maxhoffmann/transform-yaml-markdown.svg?style=flat
[4]: https://travis-ci.org/maxhoffmann/transform-yaml-markdown
