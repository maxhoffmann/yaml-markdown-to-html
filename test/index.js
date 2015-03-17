"use strict";
var fs = require('fs-extra');
var path = require('path');
var test = require('tape');
var globby = require('globby');
var transformYamlMarkdown = require('../');

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

test('usage', function(is) {
  is.plan(50);

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

  function render(currentFile, allFiles) {
    is.pass('render called');

    is.equal(typeof currentFile, 'object', 'currentFile is object');
    is.ok('markdown' in currentFile, 'currentFile has markdown');
    is.ok('path' in currentFile, 'currentFile has path');

    is.ok(Array.isArray(allFiles), 'allFiles is array');
    is.equal(allFiles.length, 5, 'allFiles’ length is 5');
    is.ok(allFiles.every(function(file) { return typeof file === 'object'; }), 'allFiles contains objects');
    is.ok('markdown' in allFiles[0], 'first item of allFiles has markdown');
    is.ok('path' in allFiles[0], 'first item of allFiles has path');

    return Promise.resolve(JSON.stringify(currentFile, null, 2));
  }

  function postRender(renderedFiles) {
    is.pass('postRender called');

    is.ok(renderedFiles.every(function(file) { return typeof file === 'object'; }), 'renderedFiles contains objects');
    is.equal(path.extname(renderedFiles[0].renderedPath), '.html');
    is.equal(sourceFiles.length, renderedFiles.length);
    is.deepEqual(
      sourceFiles.map(function(file) {
        return file.replace('.md', '').replace('.markdown', '').replace('/src/', '/dest/');
      }),
      renderedFiles.map(function(file) {
        return file.renderedPath.replace('.html', '');
      })
    );

    return Promise.resolve(htmlPaths);
  }
});
