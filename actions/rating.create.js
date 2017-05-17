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
  console.log('rating.create', args);

  if (!args.questionId) {
    console.log('[KO] No questionId specified');
    return { ok: false };
  }

  if (!args.rating) {
    console.log('[KO] No rating specified');
    return { ok: false };
  }

  return new Promise((resolve, reject) => {
    self.create(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      args['services.cloudant.ratings'],
      args.questionId,
      args.rating,
      (error, result) => {
        if (error) {
          console.log('[KO]', error);
          reject({ ok: false });
        } else {
          console.log('[OK] Rating created', result.id);
          resolve(result);
        }
      }
    );
  });
}

exports.main = global.main = main;

function create(cloudantUrl, questionsDatabase, ratingsDatabase,
  questionId, ratingValue, callback/* err,question */) {
  const cloudant = Cloudant({
    url: cloudantUrl,
    plugin: 'retry',
    retryAttempts: 5,
    retryTimeout: 500
  });
  const db = cloudant.db.use(questionsDatabase);
  db.get(questionId, (err) => {
    if (err) {
      callback(err);
    } else {
      const ratingsDb = cloudant.db.use(ratingsDatabase);
      const rating = {
        type: 'rating',
        question: questionId,
        value: ratingValue,
        created_at: new Date()
      };
      ratingsDb.insert(rating, (rErr, rResult) => {
        if (rErr) {
          callback(rErr);
        } else {
          rating.id = rResult.id;
          callback(null, rating);
        }
      });
    }
  });
}

exports.create = create;
