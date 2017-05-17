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
  console.log('question.read', args);

  if (!args.id) {
    console.log('[KO] No id specified');
    return { ok: false };
  }

  return new Promise((resolve, reject) => {
    self.get(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      args.id,
      (error, result) => {
        if (error) {
          console.log(args.id, '[KO]', error);
          reject({ ok: false });
        } else {
          console.log(args.id, '[OK]');
          resolve(result);
        }
      }
    );
  });
}

exports.main = global.main = main;

function get(cloudantUrl, cloudantDatabase, questionId, callback/* err,question */) {
  const cloudant = Cloudant({
    url: cloudantUrl,
    plugin: 'retry',
    retryAttempts: 5,
    retryTimeout: 500
  });
  const db = cloudant.db.use(cloudantDatabase);
  db.get(questionId, { include_docs: true }, (err, result) => {
    if (err) {
      callback(err);
    } else {
      // only expose a subset of the fields through the API
      const question = {
        id: result._id,
        title: result.title,
        use_cookies: result.use_cookies,
        created_at: result.created_at
      };
      callback(null, question);
    }
  });
}

exports.get = get;
