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
const uuid = require('uuid');

const self = exports;

function main(args) {
  console.log('question.create', args);

  if (!args.title && !args.title64) {
    console.log('[KO] No title specified');
    return { ok: false };
  }

  let title = args.title || decodeURIComponent(Buffer.from(args.title64, 'base64').toString());
  title = title.trim();

  // fail if no title provided
  if (title.length === 0) {
    console.log('[KO] Title is empty');
    return { ok: false };
  }

  return new Promise((resolve, reject) => {
    self.create(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      title,
      (error, result) => {
        if (error) {
          console.log('[KO]', error);
          reject({ ok: false });
        } else {
          console.log('[OK] Question created', result.id);
          resolve(result);
        }
      }
    );
  });
}
exports.main = global.main = main;

/**
 * Creates a new question. It assigs a uuid to the question for the admin link.
 */
function create(cloudantUrl, cloudantDatabase, questionTitle, callback/* err,question */) {
  const cloudant = Cloudant({
    url: cloudantUrl,
    plugin: 'retry',
    retryAttempts: 5,
    retryTimeout: 500
  });
  const db = cloudant.db.use(cloudantDatabase);
  const question = {
    type: 'question',
    title: questionTitle,
    created_at: new Date(),
    admin_uuid: uuid.v4(),
    use_cookies: false
  };
  db.insert(question, (err, result) => {
    if (err) {
      callback(err);
    } else {
      question.id = result.id;
      callback(null, question);
    }
  });
}
exports.create = create;
