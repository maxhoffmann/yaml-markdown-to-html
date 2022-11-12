export default function (currentFile, filesInCurrentFolder, allFiles) {
  return Promise.resolve(
    "<code>" +
      JSON.stringify(currentFile, null, 2) +
      " of " +
      allFiles.length +
      "\n" +
      JSON.stringify(filesInCurrentFolder, null, 2) +
      "</code>"
  );
}
