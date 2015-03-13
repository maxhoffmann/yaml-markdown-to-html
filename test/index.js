"use strict";
var fs = require('fs-extra');
var path = require('path');
var test = require('tape');
var globby = require('globby');
var transformYamlMarkdown = require('../');

test('usage', function(is) {
  is.plan(7);

  var sourcePatterns = ['**/*.md', '**/*.markdown']
    .map(function(file) {
      return path.join('test/src', file);
    });

  var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

  fs.removeSync('test/dest');
  transformYamlMarkdown({
    source: 'test/src',
    destination: 'test/dest',
    render: render,
    postRender: postRender,
  });

  function render(data) {
    is.ok('render called');
    return Promise.resolve(JSON.stringify(data, null, 2));
  }

  function postRender(htmlPaths) {
    is.ok('postRender called');

    is.equal(path.extname(htmlPaths[0]), '.html');
    is.equal(sourceFiles.length, htmlPaths.length);
    is.deepEqual(
      sourceFiles.map(function(file) {
        return file.replace('.md', '').replace('.markdown', '').replace('/src/', '/dest/');
      }),
      htmlPaths.map(function(file) {
        return file.replace('.html', '');
      })
    );

    return Promise.resolve(htmlPaths);
  }
});

test('errors', function(is) {
  is.plan(2);

  is.throws(function() {
    transformYamlMarkdown({
      source: 'test/src',
      destination: 'test/dest',
      render: ''
    });
  }, 'render !== function throws');

  is.doesNotThrow(function() {
    transformYamlMarkdown({
      source: 'test/src',
      destination: 'test/dest',
      render: function() { return Promise.resolve('html'); }
    });
  }, 'valid render function');
});
