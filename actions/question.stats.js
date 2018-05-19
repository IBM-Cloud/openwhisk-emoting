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

async function main(args) {
  console.log('question.stats', args);

  if (!args.id) {
    console.log('[KO] No id specified');
    return { ok: false };
  }

  if (!args.admin) {
    console.log('[KO] No admin uuid specified');
    return { ok: false };
  }

  try {
    console.log('Looking for count');
    const stats = await getCount(
      args['services.cloudant.url'],
      args['services.cloudant.questions'],
      args['services.cloudant.ratings'],
      args.id,
      args.admin);

    console.log('Looking get recent hours');
    stats.hourly = await getRecent(
      args['services.cloudant.url'],
      args['services.cloudant.ratings'],
      args.id,
      'hour');

    console.log('Looking get recent minutes');
    stats.minute = await getRecent(
      args['services.cloudant.url'],
      args['services.cloudant.ratings'],
      args.id,
      'minute');

    console.log(args.id, '[OK]', stats);
    return stats;
  } catch (error) {
    console.log(args.id, '[KO]', error);
    return {
      ok: false,
    };
  }
}

exports.main = global.main = main;

function getRecent(cloudantUrl, ratingsDatabase, questionId, unit) {
  return new Promise((resolve, reject) => {
    const cloudant = Cloudant({
      url: cloudantUrl,
      plugin: 'retry',
      retryAttempts: 5,
      retryTimeout: 500
    });

    const ratingsDb = cloudant.db.use(ratingsDatabase);
    ratingsDb.view('ratings', `stats-by-${unit}`, {
      startkey: [questionId, {}],
      endkey: [questionId],
      reduce: true,
      group: true,
      limit: 4 * 15, // last 4*15 units at least, can be more if some ratings have no data
      descending: true,
    }, (rErr, rResult) => {
      if (rErr) {
        reject(rErr);
      } else {
        const ratingByUnit = { };
        rResult.rows.forEach((row) => {
          if (!ratingByUnit[row.key[2]]) {
            ratingByUnit[row.key[2]] = [];
          }
          ratingByUnit[row.key[2]].push({
            date: row.key[1],
            count: row.value,
          });
        });
        Object.keys(ratingByUnit).forEach((key) => {
          ratingByUnit[key] = ratingByUnit[key].reverse();
        });
        resolve(ratingByUnit);
      }
    });
  });
}

function getCount(cloudantUrl, questionsDatabase, ratingsDatabase, questionId, adminUuid) {
  return new Promise((resolve, reject) => {
    const cloudant = Cloudant({
      url: cloudantUrl,
      plugin: 'retry',
      retryAttempts: 5,
      retryTimeout: 500
    });
    const db = cloudant.db.use(questionsDatabase);
    db.get(questionId, { include_docs: true }, (err, result) => {
      if (err) {
        reject(err);
      } else if (result.admin_uuid !== adminUuid) {
        reject('invalid admin key');
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
            reject(rErr);
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
            resolve(stats);
          }
        });
      }
    });
  });
}
