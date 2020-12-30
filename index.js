/* eslint no-console: 0 */
"use strict";
const path = require("path");

const fs = require("fs-extra");
const yaml = require("yaml-front-matter");
const chalk = require("chalk");
const { cloneDeep } = require("lodash");

const REGEX_NEWLINES = /^\n+/;
const REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;

async function yamlMarkdownToHtml(cliParams) {
  const html = (cliParams.files || [])
    .map(getFileContents(cliParams.markdown))
    .filter(Boolean)
    .map(callRender(cliParams.html, cliParams.render));

  return Promise.all(html)
    .then(callPostRender(cliParams.postRender))
    .then(() => console.log(chalk.green("done!")));
}

function getFileContents(markdownFolder) {
  return (filePath) => {
    try {
      const extension = path.extname(filePath);
      const relativePath = path
        .relative(markdownFolder, filePath)
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
  };
}

function callRender(htmlFolder, renderFunction) {
  return (file, index, allFiles) => {
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

    const destinationPath = path.join(htmlFolder, file.path + ".html");

    const clonedFile = cloneDeep(file);
    console.log(chalk.yellow("⚙️ rendering " + file.path));
    return Promise.resolve(
      renderFunction(
        clonedFile,
        cloneDeep(filesInCurrentFolder),
        cloneDeep(allFiles)
      )
    ).then(writeFile(destinationPath, clonedFile));
  };
}

function writeFile(destinationPath, file) {
  return function (renderedHtml) {
    console.log(chalk.yellow("🖨 writing " + file.path));
    fs.outputFileSync(destinationPath, renderedHtml);
    file.renderedPath = destinationPath;
    return file;
  };
}

function callPostRender(postRenderFunction) {
  return (renderedFiles) => {
    if (typeof postRenderFunction === "function") {
      console.log(chalk.yellow("🏁 post render…"));
      return Promise.resolve(postRenderFunction(cloneDeep(renderedFiles)));
    }
    return renderedFiles;
  };
}

module.exports = yamlMarkdownToHtml;
