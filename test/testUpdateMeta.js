var mercurius = require('../index.js');
var request = require('supertest');
var assert = require('assert');
var nock = require('nock');

describe('mercurius', function() {
  var token;

  before(function(done) {
    mercurius.ready.then(function() {
      request(mercurius.app)
        .post('/register')
        .send({
          machineId: 'machineX',
          endpoint: 'https://localhost:50005',
          key: 'key',
        })
        .expect(function(res) {
          token = res.text;
        })
        .end(done);
    });
  });

  it('updates the metadata successfully on `updateMeta`', function(done) {
    nock('https://localhost:50007')
    .post('/')
    .reply(201);

    request(mercurius.app)
      .post('/updateMeta')
      .send({
        token: token,
        machineId: 'machineX',
        name: 'newName',
        active: false,
      })
      .expect(200, function() {
        request(mercurius.app)
          .post('/notify')
          .send({
            token: token,
          })
          .expect(200, done);
      });
  });

  it('returns 404 on `updateMeta` if the token doesn\'t exist', function(done) {
    request(mercurius.app)
      .post('/updateMeta')
      .send({
        token: 'token_inesistente',
        machineId: 'machineX',
        name: 'newName',
      })
      .expect(404, done);
  });

  it('returns 404 on `updateMeta` if the machine doesn\'t exist', function(done) {
    request(mercurius.app)
      .post('/updateMeta')
      .send({
        token: token,
        machineId: 'machine2',
        name: 'newName',
      })
      .expect(404, done);
  });
});
