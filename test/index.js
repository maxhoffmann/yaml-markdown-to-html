"use strict";
var fs = require("fs-extra");
var path = require("path");
var test = require("tape");
var globby = require("globby");
var yamlMarkdownToHtml = require("../");

var sourcePatterns = ["**/*.md", "**/*.markdown"].map(function (file) {
  return path.join("test/content", file);
});

var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

test("errors", async function (is) {
  is.plan(2);

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");

  try {
    await yamlMarkdownToHtml({
      contentFolder: "test/content",
      publicFolder: "test/public",
      files: sourceFiles,
      renderFile: "",
    });
    is.fail("missing render function doesn’t error");
  } catch (error) {
    is.pass("render !== function throws");
  }

  try {
    await yamlMarkdownToHtml({
      contentFolder: "test/content",
      publicFolder: "test/public",
      files: sourceFiles,
      renderFile: function () {
        return Promise.resolve("html");
      },
    });
    is.pass("valid render function");
  } catch (error) {
    is.fail("valid parameters are failing");
  }

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");
});

test("usage", async function (is) {
  is.plan(196);

  await fs.remove("test/public");

  await yamlMarkdownToHtml({
    contentFolder: "test/content",
    publicFolder: "test/public",
    files: sourceFiles,
    renderFile: render,
    postRenderFile: postRender,
  });

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");

  function render(currentFile, filesInCurrentFolder, allFiles) {
    is.pass("render called");

    is.equal(typeof currentFile, "object", "currentFile is object");
    is.ok("markdown" in currentFile, "currentFile has markdown");
    is.ok("path" in currentFile, "currentFile has path");
    is.ok("updatedAt" in currentFile, "currentFile has updatedAt");
    is.ok("createdAt" in currentFile, "currentFile has createdAt");

    is.ok(Array.isArray(filesInCurrentFolder), "folder collection is array");
    is.ok(
      filesInCurrentFolder.every(function (file) {
        return typeof file === "object";
      }),
      "folder collection contains objects"
    );
    is.ok(
      "markdown" in filesInCurrentFolder[0],
      "first item of folder collection has markdown"
    );
    is.ok(
      "path" in filesInCurrentFolder[0],
      "first item of folder collection has path"
    );
    is.ok(
      "updatedAt" in filesInCurrentFolder[0],
      "first item of folder collection has updatedAt"
    );
    is.ok(
      "createdAt" in filesInCurrentFolder[0],
      "first item of folder collection has createdAt"
    );

    is.ok(Array.isArray(allFiles), "allFiles is array");
    is.equal(
      allFiles.length,
      sourceFiles.length,
      "allFiles’ length is same as sourceFiles"
    );
    is.ok(
      allFiles.every(function (file) {
        return typeof file === "object";
      }),
      "allFiles contains objects"
    );
    is.ok("markdown" in allFiles[0], "first item of allFiles has markdown");
    is.ok("path" in allFiles[0], "first item of allFiles has path");
    is.ok("updatedAt" in allFiles[0], "first item of allFiles has updatedAt");
    is.ok("createdAt" in allFiles[0], "first item of allFiles has createdAt");

    if (currentFile.path === "index") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/content"
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "test";
        }),
        'one of the files in test/content is "test"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/content is "folder/index"'
      );
    }
    if (currentFile.path === "test") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/content"
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "index";
        }),
        'one of the files in test/content is "index"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/content is "folder/index"'
      );
    }
    if (currentFile.path === "folder/another") {
      is.equal(
        filesInCurrentFolder.length,
        4,
        "four other files in test/content/folder"
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/empty";
        }),
        'one of the files in test/content/folder is "empty"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/yaml-only";
        }),
        'one of the files in test/content/folder is "yaml-only"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/content/folder is "index"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/another_folder/index";
        }),
        'one of the files in test/content/folder is "another_folder/index"'
      );
    }
    if (currentFile.path === "folder/another_folder/index") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/content/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/another-deeply-nested",
        'other file in test/content/folder/another_folder is "another-deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/deeply-nested",
        'other file in test/content/folder/another_folder is "deeply-nested"'
      );
    }
    if (currentFile.path === "folder/another_folder/deeply-nested") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/content/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/another-deeply-nested",
        'other file in test/content/folder/another_folder is "another-deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/index",
        'other file in test/content/folder/another_folder is "index"'
      );
    }
    if (currentFile.path === "folder/another_folder/another-deeply-nested") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/content/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/deeply-nested",
        'other file in test/content/folder/another_folder is "deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/index",
        'other file in test/content/folder/another_folder is "index"'
      );
    }

    return Promise.resolve(JSON.stringify(currentFile, null, 2));
  }

  function postRender(renderedFiles) {
    is.pass("postRender called");

    is.ok(
      renderedFiles.every(function (file) {
        return typeof file === "object";
      }),
      "renderedFiles contains objects"
    );
    is.equal(path.extname(renderedFiles[0].renderedPath), ".html");
    is.equal(sourceFiles.length, renderedFiles.length);

    is.deepEqual(
      sourceFiles.map(function (file) {
        return file
          .replace(".md", "")
          .replace(".markdown", "")
          .replace("/content/", "/public/");
      }),
      renderedFiles.map(function (file) {
        return file.renderedPath.replace(".html", "");
      })
    );

    return Promise.resolve(renderedFiles);
  }
});

test("cache", async function (is) {
  is.plan(30);

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");

  await yamlMarkdownToHtml({
    contentFolder: "test/content",
    publicFolder: "test/public",
    files: sourceFiles,
    renderFile: noCacheRender,
    postRenderFile: noCachePostRender,
  });

  await yamlMarkdownToHtml({
    contentFolder: "test/content",
    publicFolder: "test/public",
    files: sourceFiles,
    renderFile: cachedRender,
    postRenderFile: cachedPostRender,
  });

  const oldContent = await fs.readFile("test/content/index.md", "utf-8");

  try {
    await fs.outputFile("test/content/index.md", "# Updated File");
  } catch {
    is.fail("error updating existing markdown file");
  }

  try {
    await fs.outputFile("test/content/uncached.md", "# New File");
  } catch {
    is.fail("error writing new markdown file");
  }

  await yamlMarkdownToHtml({
    contentFolder: "test/content",
    publicFolder: "test/public",
    files: await globby(sourcePatterns, { nodir: true }),
    renderFile: outdatedCacheRender,
    postRenderFile: outdatedCachePostRender,
  });

  try {
    await fs.outputFile("test/content/index.md", oldContent);
  } catch {
    is.fail("error fixing markdown file");
  }

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");
  await fs.remove("test/content/uncached.md");

  await yamlMarkdownToHtml({
    contentFolder: "test/content",
    publicFolder: "test/public",
    files: await globby(sourcePatterns, { nodir: true }),
    renderFile: noCacheRender,
    postRenderFile: noCachePostRender,
  });

  await fs.remove(".yamlmd2htmlcache");
  await fs.remove("test/public");

  function noCacheRender(currentFile) {
    is.pass("render was called");
    return Promise.resolve(JSON.stringify(currentFile, null, 2));
  }

  function noCachePostRender(renderedFiles) {
    is.pass("postRender called");

    is.ok(
      renderedFiles.every(function (file) {
        return typeof file === "object";
      }),
      "renderedFiles contains objects"
    );
    is.equal(sourceFiles.length, renderedFiles.length);

    is.deepEqual(
      sourceFiles.map(function (file) {
        return file
          .replace(".md", "")
          .replace(".markdown", "")
          .replace("/content/", "/public/");
      }),
      renderedFiles.map(function (file) {
        return file.renderedPath.replace(".html", "");
      })
    );

    return Promise.resolve(renderedFiles);
  }

  function cachedRender() {
    is.fail("render function was called despite the cache being active");
  }

  function cachedPostRender() {
    is.fail("postRender was called");
  }

  function outdatedCacheRender(currentFile) {
    is.ok(
      ["uncached", "index"].includes(currentFile.path),
      "render was called with uncached file"
    );
    return Promise.resolve(JSON.stringify(currentFile, null, 2));
  }

  function outdatedCachePostRender(renderedFiles) {
    is.pass("postRender called");

    console.log("!! changed files", renderedFiles.length);
    is.strictEqual(renderedFiles.length, 2, "only two files were rendered");
    return Promise.resolve(renderedFiles);
  }
});
