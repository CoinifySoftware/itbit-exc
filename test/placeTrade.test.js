var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('placeTrade', function () {
  describe('Buy Order', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    const addOrderId = '5b1f51e1-3f38-4d64-918c-45c5848c76fb';

    // Mock for ItBit addOrder()
    ItBitMock.prototype.addOrder = function (walletId, side, type, amount, price, instrument, metadata, clientOrderIdentifier, callback) {
      var addOrderResponse = {
        id: addOrderId,
        walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
        side: 'buy',
        instrument: 'XBTUSD',
        type: 'limit',
        currency: 'XBT',
        amount: amount,
        price: price,
        amountFilled: '0',
        volumeWeightedAveragePrice: '0',
        createdTime: '2014-02-11T17:05:15Z',
        status: 'submitted',
        metadata: {},
        clientOrderIdentifier: ''
      };

      callback(null, addOrderResponse);
    };

    before(function () {
      // Enable mockery
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
      });
      // Register mock modules
      mockery.registerMock('itbit', ItBitMock);

      // Load your module under test
      var exchange = require('../index');
      ItBitExchange = new exchange({
        key: 'mock_key',
        secret: 'mock_secret',
        walletId: 'mock_walletid'
      });
    });

    after(function () {
      mockery.deregisterAll();
      mockery.disable();
    });

    it('places a trade and returns an object', function (done) {
      ItBitExchange.placeTrade(1299990000, 412.12, 'BTC', 'USD', function (err, result) {
        // Test response
        expect(result.externalId).to.equal(addOrderId);
        expect(result.type).to.equal('limit');
        expect(result.state).to.equal('open');
        expect(result.baseAmount).to.equal(1299990000);
        expect(result.baseCurrency).to.equal('BTC');
        expect(result.quoteCurrency).to.equal('USD');
        expect(result.limitPrice).to.equal(412.12);
        expect(result).to.have.property('raw');

        // Test types
        expect(result.id).to.be.a('undefined');
        expect(result.externalId).to.be.a('string');
        expect(result.type).to.be.a('string');
        expect(result.state).to.be.a('string');
        expect(result.baseAmount).to.be.a('number');
        expect(result.baseCurrency).to.be.a('string');
        expect(result.quoteCurrency).to.be.a('string');
        expect(result.limitPrice).to.be.a('number');
        expect(result.raw).to.be.a('object');
        expect(result.createTime).to.be.a('undefined');
        done();
      });
    });

    it('places a trade and rounds baseAmount to 4 decimals', function (done) {
      ItBitExchange.placeTrade(129999000, 412.12, 'BTC', 'USD', function (err, result) {
        expect(result.baseAmount).to.equal(129990000);
        done();
      });
    });

    it('places a trade with wrong baseAmount type and returns an error', function (done) {
      ItBitExchange.placeTrade("stringvalue", 421.12, 'BTC', 'USD', function (err, result) {
        expect(result).to.equal(undefined);
        expect(err.message).to.equal('The base amount must be a number');
        expect(err.code).to.equal(ErrorCodes.MODULE_ERROR);
        expect(err.cause).to.equal(undefined);

        done();
      });
    });

    it('rounds limitPrice to 2 decimals', function (done) {
      ItBitExchange.placeTrade(129999000, 412.55555555555, 'BTC', 'USD', function (err, result) {
        expect(result.limitPrice).to.equal(412.56);
        done();
      });

    });
  });

  describe('Sell Order', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    const addOrderId = '1b1f51e1-3f38-4d64-918c-45c5848c76fb';

    // Mock for ItBit addOrder()
    ItBitMock.prototype.addOrder = function (walletId, side, type, amount, price, instrument, metadata, clientOrderIdentifier, callback) {
      var addOrderResponse = {
        id: addOrderId,
        walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
        side: 'sell',
        instrument: 'XBTUSD',
        type: 'limit',
        currency: 'XBT',
        amount: amount,
        price: price,
        amountFilled: '0',
        volumeWeightedAveragePrice: '0',
        createdTime: '2014-02-11T17:05:15Z',
        status: 'submitted',
        metadata: {},
        clientOrderIdentifier: ''
      };

      callback(null, addOrderResponse);
    };

    before(function () {
      // Enable mockery
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
      });
      // Register mock modules
      mockery.registerMock('itbit', ItBitMock);

      // Load your module under test
      var exchange = require('../index');
      ItBitExchange = new exchange({
        key: 'mock_key',
        secret: 'mock_secret',
        walletId: 'mock_walletid'
      });
    });

    after(function () {
      mockery.deregisterAll();
      mockery.disable();
    });

    it('places a trade and returns an object', function (done) {
      ItBitExchange.placeTrade(-12340000, 412.12, 'BTC', 'USD', function (err, result) {
        if (err) {
          console.log(err);
          done();
        }
        // Test response
        expect(result.externalId).to.equal(addOrderId);
        expect(result.type).to.equal('limit');
        expect(result.state).to.equal('open');
        expect(result.baseAmount).to.equal(-12340000);
        expect(result.baseCurrency).to.equal('BTC');
        expect(result.quoteCurrency).to.equal('USD');
        expect(result.limitPrice).to.equal(412.12);
        expect(result).to.have.property('raw');

        // Test types
        expect(result.id).to.be.an('undefined');
        expect(result.externalId).to.be.a('string');
        expect(result.type).to.be.a('string');
        expect(result.state).to.be.a('string');
        expect(result.baseAmount).to.be.a('number');
        expect(result.baseCurrency).to.be.a('string');
        expect(result.quoteCurrency).to.be.a('string');
        expect(result.limitPrice).to.be.a('number');
        expect(result.raw).to.be.a('object');
        done();
      });
    });
  });
});

