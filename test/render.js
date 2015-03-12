"use strict";

module.exports = function(data) {
  return Promise.resolve(JSON.stringify(data, null, 2));
};
