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
transform-yaml-markdown <source> <destination> [render] [postRender]
```

The `render` and `postRender` functions are exported common.js functions.

`render` gets a `data` object passed with the meta data and raw markdown from the current file as the first argument and a collection of all files as the second one. It should return a Promise that fulfills with the rendered HTML.

__example:__ `render.js`

```js
module.exports = function render(currentFile, allFiles) {
  return Promise.resolve(
    '<code>'
      +JSON.stringify(currentFile, null, 2)+' of '+allFiles.length
    +'</code>'
  );
};
```

`postRender` receives a collection of rendered files including a `renderedPath` property and should also return a Promise that fulfills whenever your post render hook is done.

__example:__ `post-render.js`

```js
module.exports = function postRender(renderedFiles) {
  console.log('number of rendered files: %i', renderedFiles.length);
  return Promise.resolve(renderedFiles);
};
```

By default the command tries to load `render.js` and `post-render.js` from the current directory if not specified.

LICENSE
-------

The MIT License (MIT) Maximilian Hoffmann

[1]: http://img.shields.io/npm/v/transform-yaml-markdown.svg?style=flat
[2]: https://www.npmjs.org/package/transform-yaml-markdown
[3]: http://img.shields.io/travis/maxhoffmann/transform-yaml-markdown.svg?style=flat
[4]: https://travis-ci.org/maxhoffmann/transform-yaml-markdown
