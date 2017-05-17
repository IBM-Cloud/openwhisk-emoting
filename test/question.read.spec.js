const read = require('../actions/question.read').main;
const assert = require('chai').assert;
const nock = require('nock');

describe('Read', () => {
  it('retrieves a question', (done) => {
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

    read({
      id: '123',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).then((result) => {
      assert.equal('123', result.id);
      assert.equal('Does it work?', result.title);
      assert.isNotOk(result._id);
      assert.isNotOk(result._rev);
      assert.isNotOk(result.admin_uuid);
      assert.isFalse(result.use_cookies);
      assert.isOk(result.created_at);
      done(null);
    });
  });

  it('fails if no ID is provided', (done) => {
    assert.isFalse(read({
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).ok);
    done(null);
  });

  it('fails if ID does not exist', (done) => {
    nock('http://cloudant')
      .get('/questions/1212?include_docs=true')
      .reply(404);
    read({
      id: '1212',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).catch((result) => {
      assert.isFalse(result.ok);
      done(null);
    });
  });
});
