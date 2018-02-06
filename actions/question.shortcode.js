const Cloudant = require('cloudant');

const self = exports;

function main(args) {
  console.log('question.shortcode', args);

  return {
    ok: true
  };
}

exports.main = global.main = main;
