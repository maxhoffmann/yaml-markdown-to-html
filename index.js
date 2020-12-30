/* eslint no-console: 0 */
"use strict";
const path = require("path");
const crypto = require("crypto");

const fs = require("fs-extra");
const yaml = require("yaml-front-matter");
const chalk = require("chalk");
const { cloneDeep } = require("lodash");

const REGEX_NEWLINES = /^\n+/;
const REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;

async function yamlMarkdownToHtml(cliParams) {
  const fileContents = await Promise.all(
    (cliParams.files || []).map(getFileContents(cliParams.contentFolder))
  );

  const withoutSkippedFiles = fileContents.filter(Boolean);

  const cache = withoutSkippedFiles.reduce((result, file) => {
    result[file.path] = hash(JSON.stringify(file));
    return result;
  }, {});

  let storedCache = {};
  try {
    storedCache = await fs.readJson("./.yamlmd2htmlcache");
  } catch {
    console.info("no cache found");
  }

  const changedFiles = withoutSkippedFiles.filter(
    (file) => hash(JSON.stringify(file)) !== storedCache[file.path]
  );

  if (changedFiles.length === 0) {
    console.log(chalk.green(`✅ no changed files`));
    return;
  }

  changedFiles.forEach((file) => {
    cache[file.path] = hash(JSON.stringify(file));
  });

  try {
    await fs.outputJson("./.yamlmd2htmlcache", cache);
  } catch (error) {
    console.error("couldn’t write cache", error);
  }

  const renderedFiles = await Promise.all(
    changedFiles.map(
      renderEachFile(cliParams.publicFolder, cliParams.renderFile)
    )
  );

  await callPostRender(cliParams.postRenderFile, renderedFiles);

  console.log(chalk.green(`✅ rendered ${renderedFiles.length} files`));
}

function hash(string) {
  return crypto.createHash("sha256").update(string).digest("base64");
}

function getFileContents(markdownFolder) {
  return async (filePath) => {
    try {
      const extension = path.extname(filePath);
      const relativePath = path
        .relative(markdownFolder, filePath)
        .replace(new RegExp(extension + "$"), "");

      console.log(chalk.blue("👓 reading " + filePath));
      const contents = await fs.readFile(filePath, "utf-8");

      const data = yaml.loadFront(contents, "markdown");
      data.markdown = data.markdown.replace(REGEX_NEWLINES, "");
      data.path = relativePath;
      return data;
    } catch (error) {
      console.error(`⏩ skipped ${filePath}: ${error}`);
      return false;
    }
  };
}

function renderEachFile(htmlFolder, renderFunction) {
  return async (file, _, allFiles) => {
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

    console.log(chalk.cyan("⚙️ rendering " + file.path));
    const renderedHtml = await renderFunction(
      clonedFile,
      cloneDeep(filesInCurrentFolder),
      cloneDeep(allFiles)
    );

    console.log(chalk.yellow("🖨 writing " + clonedFile.path));
    await fs.outputFile(destinationPath, renderedHtml);
    clonedFile.renderedPath = destinationPath;

    return clonedFile;
  };
}

async function callPostRender(postRenderFunction, renderedFiles) {
  if (typeof postRenderFunction === "function") {
    console.log(chalk.yellow("🏁 calling post render"));
    postRenderFunction(cloneDeep(renderedFiles));
  }
  return renderedFiles;
}

module.exports = yamlMarkdownToHtml;
