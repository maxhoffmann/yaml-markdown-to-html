"use strict";
var fs = require('fs-extra');
var path = require('path');
var test = require('tape');
var globby = require('globby');
var transformYamlMarkdown = require('../');

test('usage', function(is) {
  is.plan(3);

  var sourcePatterns = ['**/*.md', '**/*.markdown']
    .map(function(file) {
      return path.join('test', file);
    });
  var destinationPatterns = ['**/*.html']
    .map(function(file) {
      return path.join('test', file);
    });

  var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

  fs.removeSync('test/dest');
  transformYamlMarkdown('test/src', 'test/dest', 'test/render');

  var destinationFiles = globby.sync(destinationPatterns, { nodir: true });

  is.equal(sourceFiles.length, destinationFiles.length);
  is.equal(path.extname(destinationFiles[0]), '.html');
  is.deepEqual(
    sourceFiles.map(function(file) {
      return file.replace('.md', '').replace('.markdown', '');
    }),
    destinationFiles.map(function(file) {
      return file.replace('.html', '');
    })
  );
});

test('errors', function(is) {
  is.plan(1);

  is.throws(function() {
    transformYamlMarkdown('test/src', 'test/dest', 'not found');
  });
});
