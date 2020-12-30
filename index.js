/* eslint no-console: 0 */
"use strict";
const path = require("path");

const fs = require("fs-extra");
const yaml = require("yaml-front-matter");
const chalk = require("chalk");
const { cloneDeep } = require("lodash");

const REGEX_NEWLINES = /^\n+/;
const REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;

function yamlMarkdownToHtml(args) {
  const html = (args.files || [])
    .map(getFileContents)
    .filter(Boolean)
    .map(callRender);

  return Promise.all(html)
    .then(callPostRender)
    .then(function () {
      console.log(chalk.green("done!"));
    });

  function getFileContents(filePath) {
    try {
      const extension = path.extname(filePath);
      const relativePath = path
        .relative(args.markdown, filePath)
        .replace(new RegExp(extension + "$"), "");
      console.log(chalk.yellow("👓 reading " + filePath));
      const contents = fs.readFileSync(filePath, "utf-8");
      const stats = fs.statSync(filePath);

      const data = yaml.loadFront(contents, "markdown");
      data.markdown = data.markdown.replace(REGEX_NEWLINES, "");
      data.path = relativePath;
      data.updatedAt = stats.mtime;
      data.createdAt = stats.birthtime;
      return data;
    } catch (error) {
      console.error(`skipped ${filePath}: ${error}`);
      return false;
    }
  }

  function callRender(file, index, allFiles) {
    const currentFolder = path.join(file.path, "..");
    const folderPattern =
      currentFolder === "."
        ? REGEX_NO_FOLDER
        : new RegExp("^" + currentFolder + "/[^/]+(/index)?$");

    const filesInCurrentFolder = allFiles.filter(function (testedFile) {
      return (
        folderPattern.test(testedFile.path) && testedFile.path !== file.path
      );
    });

    const destinationPath = path.join(args.html, file.path + ".html");

    const clonedFile = cloneDeep(file);
    console.log(chalk.yellow("⚙️ rendering " + file.path));
    return Promise.resolve(
      args.render(
        clonedFile,
        cloneDeep(filesInCurrentFolder),
        cloneDeep(allFiles)
      )
    ).then(writeFile(destinationPath, clonedFile));
  }

  function writeFile(destinationPath, file) {
    return function (renderedHtml) {
      console.log(chalk.yellow("🖨 writing " + file.path));
      fs.outputFileSync(destinationPath, renderedHtml);
      file.renderedPath = destinationPath;
      return file;
    };
  }

  function callPostRender(renderedFiles) {
    if (typeof args.postRender === "function") {
      console.log(chalk.yellow("🏁 post render…"));
      return Promise.resolve(args.postRender(cloneDeep(renderedFiles)));
    }
    return renderedFiles;
  }
}

module.exports = yamlMarkdownToHtml;
