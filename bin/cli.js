#!/usr/bin/env node
"use strict";
var path = require('path');

var args = process.argv.slice(2);

var params = {
  source: args[0] || 'src',
  destination: args[1] || 'dest',
  render: require(path.resolve(process.cwd(), args[2] || 'render'))
};

try {
  params.postRender = require(path.resolve(process.cwd(), args[3] || 'post-render'));
} catch(e) {
  params.postRender = false;
}

require('../')(params);
