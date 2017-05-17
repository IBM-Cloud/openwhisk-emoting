const stats = require('../actions/question.stats').main;
const assert = require('chai').assert;
const nock = require('nock');

describe('Stats', () => {
  it('retrieves statistics for question', (done) => {
    nock('http://cloudant')
      .get('/questions/123?include_docs=true')
      .reply(200, {
        _id: '123',
        _rev: '1-000',
        title: 'Does it work?',
        admin_uuid: '123-456',
        use_cookies: false,
        created_at: new Date()
      })
      .get('/ratings/_design/ratings/_view/stats?startkey=%5B%22123%22%5D&endkey=%5B%22123%22%2C%7B%7D%5D&reduce=true&group=true')
      .reply(200, {
        rows: [
          {
            key: ['123', 'verygood'],
            value: 10
          },
          {
            key: ['123', 'bad'],
            value: 15
          },
        ]
      });
    stats({
      id: '123',
      admin: '123-456',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).then((result) => {
      assert.equal(25, result.total);
      assert.equal(10, result.ratings.verygood.value);
      assert.equal('Does it work?', result.question.title);
      assert.isNotOk(result.question._id);
      assert.isNotOk(result.question._rev);
      assert.isNotOk(result.question.admin_uuid);
      assert.isFalse(result.question.use_cookies);
      assert.isOk(result.question.created_at);
      done(null);
    });
  });

  it('fails if no question ID is provided', (done) => {
    assert.isFalse(stats({
      admin: '123-456',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).ok);
    done(null);
  });

  it('fails if no admin ID is provided', (done) => {
    assert.isFalse(stats({
      id: '123',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).ok);
    done(null);
  });

  it('fails if invalid admin id is specified', (done) => {
    nock('http://cloudant')
      .get('/questions/123?include_docs=true')
      .reply(200, {
        _id: '123',
        _rev: '1-000',
        title: 'Does it work?',
        admin_uuid: '123-456',
        use_cookies: false,
        created_at: new Date()
      });
    stats({
      id: '123',
      admin: '30303-2222',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).catch((result) => {
      assert.isFalse(result.ok);
      done(null);
    });
  });

  it('fails if question ID does not exist', (done) => {
    nock('http://cloudant')
      .get('/questions/1212?include_docs=true')
      .reply(404);
    stats({
      id: '1212',
      admin: '123-456',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).catch((error) => {
      assert.isFalse(error.ok);
      done(null);
    });
  });

  it('fails if error while retrieving answers', (done) => {
    nock('http://cloudant')
      .get('/questions/123?include_docs=true')
      .reply(200, {
        _id: '123',
        _rev: '1-000',
        title: 'Does it work?',
        admin_uuid: '123-456',
        use_cookies: false,
        created_at: new Date()
      })
      .get('/ratings/_design/ratings/_view/stats?startkey=%5B%22123%22%5D&endkey=%5B%22123%22%2C%7B%7D%5D&reduce=true&group=true')
      .reply(503);
    stats({
      id: '123',
      admin: '123-456',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).catch((error) => {
      assert.isFalse(error.ok);
      done(null);
    });
  });
});
