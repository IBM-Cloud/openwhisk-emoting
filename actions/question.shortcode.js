const Cloudant = require('cloudant');

const self = exports;

function main(args) {
  console.log('question.shortcode', args);

  return self.getQuestion(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      args.id,
      args.admin)
    .then(question => self.setShortcode(
      args['services.cloudant.url'],
      args['services.cloudant.shortcodes'],
      args.id,
      args.shortcode))
    .then(() => {
      ok: true
    })
    .catch((err) => {
      ok: false
    });
}
exports.main = global.main = main;

function getQuestion(cloudantUrl, questionsDbname, questionId, adminUuid) {
  return new Promise((resolve, reject) => {
    console.log('Retrieving question', questionId);
    const cloudant = Cloudant({
      url: cloudantUrl,
      plugin: 'retry',
      retryAttempts: 5,
      retryTimeout: 500
    });
    const db = cloudant.db.use(questionsDbname);
    db.get(questionId, { include_docs: true }, (err, result) => {
      if (err) {
        console.log('[KO] Question not found', err);
        reject({ ok: false });
      } else if (result.admin_uuid !== adminUuid) {
        console.log('[KO] Invalid admin uuid');
        reject({ ok: false });
      } else {
        console.log('[OK] Question found', result);
        resolve(result);
      }
    });
  });
}
exports.getQuestion = getQuestion;

function setShortcode(cloudantUrl, shortcodesDbname, questionId, shortcode) {
  return new Promise((resolve, reject) => {
    console.log('Setting shortcode', questionId, shortcode);
    const cloudant = Cloudant({
      url: cloudantUrl,
      plugin: 'retry',
      retryAttempts: 5,
      retryTimeout: 500
    });
    const db = cloudant.db.use(shortcodesDbname);
    db.insert({
      _id: shortcode.toUpperCase(),
      questionId,
    }, (err, result) => {
      if (err) {
        console.log('[KO]', err);
        reject();
      } else {
        console.log('[OK] Shortcode set', result);
        resolve({
          ok: true
        });
      }
    });
  });
}
exports.setShortcode = setShortcode;
