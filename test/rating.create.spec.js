const create = require('../actions/rating.create').main;
const assert = require('chai').assert;
const nock = require('nock');

describe('Create', () => {
  it('creates a new rating', (done) => {
    nock('http://cloudant')
      .get('/questions/123')
      .reply(200, {
        _id: 123,
        _rev: '1-000',
        title: 'Does it work?',
        admin_uuid: '123-456',
        use_cookies: false,
        created_at: new Date()
      })
      .post('/ratings')
      .reply(200, {
        id: '456',
        rev: '1-001'
      });

    create({
      questionId: '123',
      rating: 'good',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).then((result) => {
      assert.equal('456', result.id);
      assert.equal('good', result.value);
      assert.equal(123, result.question);
      assert.isOk(result.created_at);
      done(null);
    });
  });

  it('fails if no ID is provided', (done) => {
    assert.isFalse(create({
      rating: 'good',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).ok);
    done(null);
  });

  it('fails if no rating is provided', (done) => {
    assert.isFalse(create({
      questionId: '123',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).ok);
    done(null);
  });

  it('fails if question ID does not exist', (done) => {
    nock('http://cloudant')
      .get('/questions/1212')
      .reply(404);
    create({
      questionId: '1212',
      rating: 'good',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).catch((result) => {
      assert.isFalse(result.ok);
      done(null);
    });
  });

  it('fails if insert fails', (done) => {
    nock('http://cloudant')
      .get('/questions/123')
      .reply(200, {
        _id: 123,
        _rev: '1-000',
        title: 'Does it work?',
        admin_uuid: '123-456',
        use_cookies: false,
        created_at: new Date()
      })
      .post('/ratings')
      .reply(503);

    create({
      questionId: '123',
      rating: 'good',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions',
      'services.cloudant.ratings': 'ratings'
    }).catch((error) => {
      assert.isFalse(error.ok);
      done(null);
    });
  });
});
