"use strict";
var fs = require('fs-extra');
var path = require('path');
var test = require('tape');
var globby = require('globby');
var yamlMarkdownToHtml = require('../');

test('errors', function(is) {
  is.plan(2);

  is.throws(function() {
    yamlMarkdownToHtml({
      source: 'test/src',
      destination: 'test/dest',
      render: ''
    });
  }, 'render !== function throws');

  is.doesNotThrow(function() {
    yamlMarkdownToHtml({
      source: 'test/src',
      destination: 'test/dest',
      render: function() { return Promise.resolve('html'); }
    });
  }, 'valid render function');
});

test('usage', function(is) {
  is.plan(94);

  var sourcePatterns = ['**/*.md', '**/*.markdown']
    .map(function(file) {
      return path.join('test/src', file);
    });

  var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

  fs.removeSync('test/dest');
  yamlMarkdownToHtml({
    source: 'test/src',
    destination: 'test/dest',
    render: render,
    postRender: postRender,
  });

  function render(currentFile, filesInCurrentFolder, allFiles) {
    is.pass('render called');

    is.equal(typeof currentFile, 'object', 'currentFile is object');
    is.ok('markdown' in currentFile, 'currentFile has markdown');
    is.ok('path' in currentFile, 'currentFile has path');

    is.ok(Array.isArray(allFiles), 'allFiles is array');
    is.equal(allFiles.length, sourceFiles.length, 'allFiles’ length is same as sourceFiles');
    is.ok(allFiles.every(function(file) { return typeof file === 'object'; }), 'allFiles contains objects');
    is.ok('markdown' in allFiles[0], 'first item of allFiles has markdown');
    is.ok('path' in allFiles[0], 'first item of allFiles has path');

    if (currentFile.path === 'index') {
      is.equal(filesInCurrentFolder.length, 1, 'one other file in test/src');
      is.equal(filesInCurrentFolder[0].path, 'test', 'other file in test/src is "test"');
    }
    if (currentFile.path === 'test') {
      is.equal(filesInCurrentFolder.length, 1, 'one other file in test/src');
      is.equal(filesInCurrentFolder[0].path, 'index', 'other file in test/src is "index"');
    }
    if (currentFile.path === 'folder/another') {
      is.equal(filesInCurrentFolder.length, 3, 'three other files in test/src/folder');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/empty';
      }), 'one of the files in test/src/folder is "empty"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/yaml-only';
      }), 'one of the files in test/src/folder is "yaml-only"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/another_folder/index';
      }), 'one of the files in test/src/folder is "another_folder/index"');
    }
    if (currentFile.path === 'folder/another_folder/index') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/src/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/another-deeply-nested', 'other file in test/src/folder/another_folder is "another-deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/deeply-nested', 'other file in test/src/folder/another_folder is "deeply-nested"');
    }
    if (currentFile.path === 'folder/another_folder/deeply-nested') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/src/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/another-deeply-nested', 'other file in test/src/folder/another_folder is "another-deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/index', 'other file in test/src/folder/another_folder is "index"');
    }
    if (currentFile.path === 'folder/another_folder/another-deeply-nested') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/src/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/deeply-nested', 'other file in test/src/folder/another_folder is "deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/index', 'other file in test/src/folder/another_folder is "index"');
    }

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
