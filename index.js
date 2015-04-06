/* eslint no-console: 0 */
"use strict";
var path = require('path');

var fs = require('fs-extra');
var yaml = require('yaml-front-matter');
var chalk = require('chalk');
var cloneDeep = require('lodash/lang/cloneDeep');

var REGEX_NEWLINES = /^\n+/;
var REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;

function yamlMarkdownToHtml(args) {
  var html = (args.files || [])
    .map(getFileContents)
    .map(callRender);

  return Promise.all(html)
    .then(callPostRender)
    .then(function() {
      console.log(chalk.green('done!'));
    });

  function getFileContents(filePath) {
    var extension = path.extname(filePath);
    var relativePath = path.relative(args.markdown, filePath)
      .replace(new RegExp(extension+'$'), '');
    var contents = fs.readFileSync(filePath, 'utf-8');
    var stats = fs.statSync(filePath);

    var data = yaml.loadFront(contents, 'markdown');
    data.markdown = data.markdown.replace(REGEX_NEWLINES, '');
    data.path = relativePath;
    data.updatedAt = stats.mtime;
    data.createdAt = stats.birthtime;
    return data;
  }

  function callRender(file, index, allFiles) {
    var currentFolder = path.join(file.path, '..');
    var folderPattern = (currentFolder === '.')
      ? REGEX_NO_FOLDER
      : new RegExp('^'+currentFolder+'\/[^\/]+(\/index)?$');

    var filesInCurrentFolder = allFiles.filter(function(testedFile) {
      return folderPattern.test(testedFile.path) && testedFile.path !== file.path;
    });

    var destinationPath = path.join(args.html, file.path+'.html');

    console.log(chalk.yellow('rendering '+file.path));
    var clonedFile = cloneDeep(file);
    return Promise.resolve(
        args.render(clonedFile, cloneDeep(filesInCurrentFolder), cloneDeep(allFiles))
      )
      .then(writeFile(destinationPath, clonedFile));
  }

  function writeFile(destinationPath, data) {
    return function(renderedHtml) {
      fs.outputFileSync(destinationPath, renderedHtml);
      data.renderedPath = destinationPath;
      return data;
    };
  }

  function callPostRender(renderedFiles) {
    if (typeof args.postRender === 'function') {
      console.log(chalk.yellow('post render…'));
      return Promise.resolve(args.postRender(cloneDeep(renderedFiles)));
    }
    return renderedFiles;
  }
}

module.exports = yamlMarkdownToHtml;
