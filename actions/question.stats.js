/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Cloudant = require('cloudant');

const self = exports;

function main(args) {
  console.log('question.stats', args);

  if (!args.id) {
    console.log('[KO] No id specified');
    return { ok: false };
  }

  if (!args.admin) {
    console.log('[KO] No admin uuid specified');
    return { ok: false };
  }

  return new Promise((resolve, reject) => {
    self.get(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      args['services.cloudant.ratings'],
      args.id,
      args.admin,
      (error, result) => {
        if (error) {
          console.log(args.id, '[KO]', error);
          reject({ ok: false });
        } else {
          console.log(args.id, '[OK]', result);
          resolve(result);
        }
      }
    );
  });
}

exports.main = global.main = main;

function get(cloudantUrl, questionsDatabase, ratingsDatabase,
  questionId, adminUuid, callback/* err,question */) {
  const cloudant = Cloudant({
    url: cloudantUrl,
    plugin: 'retry',
    retryAttempts: 5,
    retryTimeout: 500
  });
  const db = cloudant.db.use(questionsDatabase);
  db.get(questionId, { include_docs: true }, (err, result) => {
    if (err) {
      callback(err);
    } else if (result.admin_uuid !== adminUuid) {
      callback('invalid admin key');
    } else {
      // only expose a subset of the fields through the API
      const question = {
        id: result._id,
        title: result.title,
        use_cookies: result.use_cookies,
        created_at: result.created_at,
      };

      const ratingsDb = cloudant.db.use(ratingsDatabase);
      ratingsDb.view('ratings', 'stats', {
        startkey: [questionId],
        endkey: [questionId, {}],
        reduce: true,
        group: true
      }, (rErr, rResult) => {
        if (rErr) {
          callback(rErr);
        } else {
          const stats = {
            total: 0,
            ratings: {}
          };
          rResult.rows.forEach((row) => {
            stats.ratings[row.key[1]] = { value: row.value };
            stats.total += row.value;
          });
          Object.keys(stats.ratings).forEach((rating) => {
            stats.ratings[rating].percent = stats.total > 0 ?
              Math.round((stats.ratings[rating].value * 100) / stats.total) : 0;
          });
          stats.question = question;
          callback(null, stats);
        }
      });
    }
  });
}

exports.get = get;
