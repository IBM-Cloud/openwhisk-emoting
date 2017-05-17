const create = require('../actions/question.create').main;
const assert = require('chai').assert;
const nock = require('nock');

describe('Create', () => {
  it('creates a new question', (done) => {
    nock('http://cloudant')
      .post('/questions')
      .reply(200, {
        id: '123',
        rev: '1-000'
      });

    create({
      title: 'Does it work?',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).then((result) => {
      assert.equal('123', result.id);
      assert.equal('Does it work?', result.title);
      assert.isOk(result.admin_uuid);
      assert.isFalse(result.use_cookies);
      assert.isOk(result.created_at);
      done(null);
    });
  });

  it('handles insert failures', (done) => {
    nock('http://cloudant')
      .post('/questions')
      .reply(503);

    create({
      title: 'Does it work?',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).catch((error) => {
      assert.isFalse(error.ok);
      done(null);
    });
  });

  it('fails if no title is provided', (done) => {
    assert.isFalse(create({
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).ok);
    done(null);
  });

  it('fails if title is empty', (done) => {
    assert.isFalse(create({
      title: '  ',
      'services.cloudant.url': 'http://cloudant',
      'services.cloudant.questions': 'questions'
    }).ok);
    done(null);
  });
});
