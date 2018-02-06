const Cloudant = require('cloudant');

const self = exports;

function main(args) {
  console.log('rating.bysms', args);

  return {
    ok: true
  };
}

exports.main = global.main = main;
