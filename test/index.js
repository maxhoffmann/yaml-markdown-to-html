"use strict";
var fs = require('fs-extra');
var path = require('path');
var test = require('tape');
var globby = require('globby');
var yamlMarkdownToHtml = require('../');

var sourcePatterns = ['**/*.md', '**/*.markdown']
  .map(function(file) {
    return path.join('test/markdown', file);
  });

var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

test('errors', function(is) {
  is.plan(2);

  is.throws(function() {
    yamlMarkdownToHtml({
      markdown: 'test/markdown',
      html: 'test/html',
      files: sourceFiles,
      render: ''
    });
  }, 'render !== function throws');

  is.doesNotThrow(function() {
    yamlMarkdownToHtml({
      markdown: 'test/markdown',
      html: 'test/html',
      files: sourceFiles,
      render: function() { return Promise.resolve('html'); }
    });
  }, 'valid render function');
});

test('usage', function(is) {
  is.plan(196);

  fs.removeSync('test/html');
  yamlMarkdownToHtml({
    markdown: 'test/markdown',
    html: 'test/html',
    files: sourceFiles,
    render: render,
    postRender: postRender,
  });

  function render(currentFile, filesInCurrentFolder, allFiles) {
    is.pass('render called');

    is.equal(typeof currentFile, 'object', 'currentFile is object');
    is.ok('markdown' in currentFile, 'currentFile has markdown');
    is.ok('path' in currentFile, 'currentFile has path');
    is.ok('updatedAt' in currentFile, 'currentFile has updatedAt');
    is.ok('createdAt' in currentFile, 'currentFile has createdAt');

    is.ok(Array.isArray(filesInCurrentFolder), 'folder collection is array');
    is.ok(filesInCurrentFolder.every(function(file) { return typeof file === 'object'; }), 'folder collection contains objects');
    is.ok('markdown' in filesInCurrentFolder[0], 'first item of folder collection has markdown');
    is.ok('path' in filesInCurrentFolder[0], 'first item of folder collection has path');
    is.ok('updatedAt' in filesInCurrentFolder[0], 'first item of folder collection has updatedAt');
    is.ok('createdAt' in filesInCurrentFolder[0], 'first item of folder collection has createdAt');

    is.ok(Array.isArray(allFiles), 'allFiles is array');
    is.equal(allFiles.length, sourceFiles.length, 'allFiles’ length is same as sourceFiles');
    is.ok(allFiles.every(function(file) { return typeof file === 'object'; }), 'allFiles contains objects');
    is.ok('markdown' in allFiles[0], 'first item of allFiles has markdown');
    is.ok('path' in allFiles[0], 'first item of allFiles has path');
    is.ok('updatedAt' in allFiles[0], 'first item of allFiles has updatedAt');
    is.ok('createdAt' in allFiles[0], 'first item of allFiles has createdAt');


    if (currentFile.path === 'index') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/markdown');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'test';
      }), 'one of the files in test/markdown is "test"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/index';
      }), 'one of the files in test/markdown is "folder/index"');
    }
    if (currentFile.path === 'test') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/markdown');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'index';
      }), 'one of the files in test/markdown is "index"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/index';
      }), 'one of the files in test/markdown is "folder/index"');
    }
    if (currentFile.path === 'folder/another') {
      is.equal(filesInCurrentFolder.length, 4, 'four other files in test/markdown/folder');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/empty';
      }), 'one of the files in test/markdown/folder is "empty"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/yaml-only';
      }), 'one of the files in test/markdown/folder is "yaml-only"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/index';
      }), 'one of the files in test/markdown/folder is "index"');
      is.ok(filesInCurrentFolder.some(function(file) {
        return file.path === 'folder/another_folder/index';
      }), 'one of the files in test/markdown/folder is "another_folder/index"');
    }
    if (currentFile.path === 'folder/another_folder/index') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/markdown/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/another-deeply-nested', 'other file in test/markdown/folder/another_folder is "another-deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/deeply-nested', 'other file in test/markdown/folder/another_folder is "deeply-nested"');
    }
    if (currentFile.path === 'folder/another_folder/deeply-nested') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/markdown/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/another-deeply-nested', 'other file in test/markdown/folder/another_folder is "another-deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/index', 'other file in test/markdown/folder/another_folder is "index"');
    }
    if (currentFile.path === 'folder/another_folder/another-deeply-nested') {
      is.equal(filesInCurrentFolder.length, 2, 'two other file in test/markdown/folder/another_folder');
      is.equal(filesInCurrentFolder[0].path, 'folder/another_folder/deeply-nested', 'other file in test/markdown/folder/another_folder is "deeply-nested"');
      is.equal(filesInCurrentFolder[1].path, 'folder/another_folder/index', 'other file in test/markdown/folder/another_folder is "index"');
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
        return file.replace('.md', '').replace('.markdown', '').replace('/markdown/', '/html/');
      }),
      renderedFiles.map(function(file) {
        return file.renderedPath.replace('.html', '');
      })
    );

    return Promise.resolve(renderedFiles);
  }
});
