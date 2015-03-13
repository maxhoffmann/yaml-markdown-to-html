"use strict";

module.exports = function(data) {
  return Promise.resolve('<code>'+JSON.stringify(data, null, 2)+'</code>');
};
