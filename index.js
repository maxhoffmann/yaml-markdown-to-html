/* eslint no-console: 0 */
import path from "path";
import fs from "fs-extra";
import yaml from "yaml-front-matter";
import chalk from "chalk";
import cloneDeep from "lodash.clonedeep";

const REGEX_NEWLINES = /^\n+/;
const REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;

export default async function yamlMarkdownToHtml(cliParams) {
  const files = cliParams.files || [];
  const fileContents = await Promise.all(
    files.map(getFileContents(cliParams.contentFolder))
  );

  const validFileContents = fileContents.filter(Boolean);

  if (validFileContents.length === 0) {
    console.log(chalk.green(`✅ no changed files`));
    return;
  }

  const renderedFiles = await Promise.all(
    validFileContents.map(
      renderEachFile(cliParams.publicFolder, cliParams.renderFile)
    )
  );

  await callPostRender(cliParams.postRenderFile, renderedFiles);

  console.log(chalk.green(`✅ rendered ${renderedFiles.length} files`));
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
