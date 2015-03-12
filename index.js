"use strict";
var path = require('path');

var globby = require('globby');
var fs = require('fs-extra');
var yaml = require('yaml-front-matter');

var REGEX_NEWLINES = /^\n+/;

function transformYamlMarkdown(sourceFolder, destinationFolder, renderFunction) {
  sourceFolder = sourceFolder || 'src';
  destinationFolder = destinationFolder || 'dest';
  renderFunction = renderFunction
    ? path.resolve(process.cwd(), renderFunction)
    : path.resolve(process.cwd(), 'render');

  var render = require(renderFunction);

  var patterns = ['**/*.md', '**/*.markdown']
    .map(function(file) {
      return path.join(sourceFolder, file);
    });

  var paths = globby.sync(patterns, { nodir: true });

  paths.map(function(filePath) {
    var extension = path.extname(filePath);
    var relativePath = path.relative(sourceFolder, filePath)
      .replace(RegExp(extension+'$'), '');
    var destinationPath = path.join(destinationFolder, relativePath+'.html');

    var contents = fs.readFileSync(filePath, 'utf-8');
    var data = yaml.loadFront(contents, 'markdown');
    data.markdown = data.markdown.replace(REGEX_NEWLINES, '');
    data.path = relativePath;

    render(data)
      .then(writeFile(destinationPath))
      .catch(console.error);
  });
}

function writeFile(destinationPath) {
  return function(html) {
    fs.outputFileSync(destinationPath, html);
  };
}

module.exports = transformYamlMarkdown;
