"use strict";
var path = require('path');

var globby = require('globby');
var fs = require('fs-extra');
var yaml = require('yaml-front-matter');
var chalk = require('chalk');
var cloneDeep = require('lodash/lang/cloneDeep');

var REGEX_NEWLINES = /^\n+/;
var REGEX_NO_FOLDER = /^[^\/]+$/;

function transformYamlMarkdown(args) {
  var patterns = ['**/*.md', '**/*.markdown']
    .map(function(file) {
      return path.join(args.source, file);
    });

  var paths = globby.sync(patterns, { nodir: true });

  var html = paths
    .map(function(filePath) {
      var extension = path.extname(filePath);
      var relativePath = path.relative(args.source, filePath)
        .replace(RegExp(extension+'$'), '');
      var contents = fs.readFileSync(filePath, 'utf-8');

      var data = yaml.loadFront(contents, 'markdown');
      data.markdown = data.markdown.replace(REGEX_NEWLINES, '');
      data.path = relativePath;
      return data;
    })
    .map(function(file, index, allFiles) {
      var currentFolder = path.join(file.path, '..');
      var folderPattern = (currentFolder === '.')
        ? REGEX_NO_FOLDER
        : new RegExp('^'+currentFolder+'\/[^\/]+$');
      var filesInCurrentFolder = allFiles.filter(function(testedFile) {
        return folderPattern.test(testedFile.path) && testedFile.path !== file.path;
      });

      var destinationPath = path.join(args.destination, file.path+'.html');

      console.log(chalk.yellow('rendering '+file.path));
      var clonedFile = cloneDeep(file);
      return Promise.resolve(args.render(clonedFile, cloneDeep(filesInCurrentFolder), cloneDeep(allFiles)))
        .then(writeFile(destinationPath, clonedFile));
    });

  return Promise.all(html)
    .then(function(renderedFiles) {
      if (typeof args.postRender === 'function') {
        console.log(chalk.yellow('post render…'));
        return Promise.resolve(args.postRender(cloneDeep(renderedFiles)));
      }
      return renderedFiles;
    })
    .then(function() {
      console.log(chalk.green('done!'));
    });
}

function writeFile(destinationPath, data) {
  return function(html) {
    fs.outputFileSync(destinationPath, html);
    data.renderedPath = destinationPath;
    return data;
  };
}

module.exports = transformYamlMarkdown;
