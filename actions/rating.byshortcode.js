const Cloudant = require('cloudant');

const self = exports;

function main(args) {
  console.log('rating.byshortcode', args);

  if (!args.shortcode) {
    console.log('[KO] No shortcode specified');
    return { ok: false };
  }

  if (!args.rating) {
    console.log('[KO] No rating specified');
    return { ok: false };
  }

  return self.findQuestionId(
      args['services.cloudant.url'],
      args['services.cloudant.shortcodes'],
      args.shortcode)
    .then((questionId) => {
      console.log('[OK] Returning rating body');
      return {
        questionId,
        rating: args.rating
      };
    })
    .catch((err) => {
      console.log('[KO]', err);
      return {
        ok: false
      };
    });
}
exports.main = global.main = main;

function findQuestionId(cloudantUrl, shortcodesDbname, shortcode) {
  return new Promise((resolve, reject) => {
    const cloudant = Cloudant({
      url: cloudantUrl,
      plugin: 'retry',
      retryAttempts: 5,
      retryTimeout: 500
    });
    const db = cloudant.db.use(shortcodesDbname);
    db.get(shortcode.toUpperCase(), { include_docs: true }, (err, result) => {
      if (err) {
        console.log('[KO]', err);
        reject({ ok: false });
      } else {
        console.log('[OK] Found question', result.questionId);
        resolve(result.questionId);
      }
    });
  });
}
exports.findQuestionId = findQuestionId;
