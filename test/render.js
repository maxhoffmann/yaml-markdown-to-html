"use strict";

module.exports = function(currentFile, allFiles) {
  return Promise.resolve(
    '<code>'
      +JSON.stringify(currentFile, null, 2)+' of '+allFiles.length
    +'</code>'
  );
};
