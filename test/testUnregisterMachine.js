var mercurius = require('../index.js');
var request = require('supertest');
var assert = require('assert');
var nock = require('nock');
var crypto = require('crypto');
var urlBase64 = require('urlsafe-base64');
var testUtils = require('./testUtils.js');

var userCurve = crypto.createECDH('prime256v1');

var userPublicKey = userCurve.generateKeys();
var userPrivateKey = userCurve.getPrivateKey();

describe('mercurius unregisterMachine', function() {
  var token;

  before(function() {
    return mercurius.ready
    .then(() => testUtils.register(mercurius.app, 'machine_1', 'https://android.googleapis.com/gcm/send/someSubscriptionID', ''))
    .then(gotToken => token = gotToken)
    .then(() => testUtils.register(mercurius.app, 'machine_2', 'https://localhost:50005', urlBase64.encode(userPublicKey), token))
    .then(() => testUtils.register(mercurius.app, 'machine_3', 'https://localhost:50006', urlBase64.encode(userPublicKey), token));
  });

  it('replies with 404 on `getPayload` if there\'s no payload available', function(done) {
    request(mercurius.app)
    .get('/getPayload/' + token)
    .send()
    .expect(404, done);
  });

  it('successfully unregisters a GCM endpoint', function(done) {
    nock('https://android.googleapis.com/')
    .post('/gcm/send')
    .reply(200);

    request(mercurius.app)
    .post('/unregisterMachine')
    .send({
      token: token,
      machineId: 'machine_1',
    })
    .expect(200, done);
  });

  it('replies with the payload encoded in JSON on `getPayload` if there\'s a payload available', function(done) {
    request(mercurius.app)
    .get('/getPayload/' + token)
    .send()
    .expect(function(res) {
      assert.equal(res.status, 200);
      var obj = JSON.parse(res.text);
      assert.equal(obj.title, 'unregister');
      assert.equal(obj.body, 'called from unregisterMachine');
    })
    .end(done);
  });

  it('successfully unregisters a machine', function(done) {
    nock('https://localhost:50005')
    .post('/')
    .reply(201);

    request(mercurius.app)
    .post('/unregisterMachine')
    .send({
      token: token,
      machineId: 'machine_2',
    })
    .expect(200, done);
  });

  it('replies with 404 when trying to unregister a non existing token', function(done) {
    request(mercurius.app)
    .post('/unregisterMachine')
    .send({
      token: 'nonexistingtoken',
      machineId: 'machine',
    })
    .expect(404, done);
  });

  it('replies with 404 when trying to unregister a non registered machine', function(done) {
    request(mercurius.app)
    .post('/unregisterMachine')
    .send({
      token: token,
      machineId: 'non-existing-machine',
    })
    .expect(404, done);
  });
});
