#!/usr/bin/env node
"use strict";
var path = require('path');

var args = process.argv.slice(2);

var params = {
 source: args[0] || 'src',
 destination: args[1] || 'dest'
};

if ( args[2] ) {
  params.render = require(path.resolve(process.cwd(), args[2]));
}
if ( args[3] ) {
  params.postRender = require(path.resolve(process.cwd(), args[3]));
}

require('../')(params);
