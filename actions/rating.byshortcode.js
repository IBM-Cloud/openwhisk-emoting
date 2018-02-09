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
      args.shortcode.toUpperCase())
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

    db.find({
      selector: {
        _id: {
          $lte: shortcode
        }
      },
      sort: [
        {
          _id: 'desc' // put the longest shortcodes first
        }
      ]
    }, (err, result) => {
      if (err) {
        console.log('[KO]', err);
        reject({ ok: false });
      } else if (result.docs.length === 0) {
        console.log('[KO] No result', err);
        reject({ ok: false });
      } else {
        // find the first shortcode at the beginning of this sentence
        const elected = result.docs.find(doc => shortcode.startsWith(doc._id));
        if (!elected) {
          console.log('[KO] Shortcode not found in', result.docs);
          reject({ ok: false });
        } else {
          console.log('[OK] Found question', elected.questionId);
          resolve(elected.questionId);
        }
      }
    });
  });
}
exports.findQuestionId = findQuestionId;
