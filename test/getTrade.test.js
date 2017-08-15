var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('getTrade', function() {
  describe('Open trade', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    var response = {
      id: '148ffda4-83a0-4033-a5bb-8929d523f59f',
      walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
      side: 'buy',
      instrument: 'XBTUSD',
      type: 'limit',
      currency: 'XBT',
      amount: '0.0010',
      price: '400.99',
      amountFilled: '0',
      volumeWeightedAveragePrice: '0',
      createdTime: '2014-02-11T17:05:15Z',
      status: 'submitted',
      metadata: {},
      clientOrderIdentifier: ''
    };

    ItBitMock.prototype.getOrder = function (walletId, orderId, callback) {
      callback(null, response);
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

    it('get trade and returns object', function (done) {
      var tradeObject = {
        raw: {
          id: '148ffda4-83a0-4033-a5bb-8929d523f59f'
        }
      };
      // Call the API endpoint
      ItBitExchange.getTrade(tradeObject, function (err, result) {
        expect(result.externalId).to.equal(response.id);
        expect(result.type).to.equal('limit');
        expect(result.state).to.equal('open');
        expect(result.baseAmount).to.equal(100000);
        expect(result.baseCurrency).to.equal('BTC');
        expect(result.quoteCurrency).to.equal('USD');
        expect(result.limitPrice).to.equal(400.99);

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
        expect(result.createTime).to.be.an('undefined');

        done();
      });
    });
  });

  describe('Closed trade', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    var getOrderResponse = {
      id: '248ffda4-83a0-4033-a5bb-8929d523f59f',
      walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
      side: 'buy',
      instrument: 'XBTUSD',
      type: 'limit',
      currency: 'XBT',
      amount: '0.0010',
      price: '400.99',
      amountFilled: '0',
      volumeWeightedAveragePrice: '0',
      createdTime: '2014-02-11T17:05:15Z',
      status: 'filled',
      metadata: {},
      clientOrderIdentifier: ''
    };

    ItBitMock.prototype.getOrder = function (walletId, orderId, callback) {
      callback(null, getOrderResponse);
    };

    ItBitMock.prototype.getWalletTrades = function (walletId, params, callback) {
      var response = {
        "totalNumberOfRecords": "2",
        "currentPageNumber": "1",
        "latestExecutionId": "332",
        "recordsPerPage": "50",
        "tradingHistory": [
          {
            "orderId": "248ffda4-83a0-4033-a5bb-8929d523f59f",
            "timestamp": "2015-05-11T14:48:01.9870000Z",
            "instrument": "XBTUSD",
            "direction": "buy",
            "currency1": "XBT",
            "currency1Amount": "0.00010000",
            "currency2": "USD",
            "currency2Amount": "200.0250530000000000",
            "rate": "250.53000000",
            "commissionPaid": "0.0200000",
            "commissionCurrency": "USD",
            "rebatesApplied": "-0.000125265",
            "rebateCurrency": "USD"
          },
          {
            "orderId": "248ffda4-83a0-4033-a5bb-8929d523f59f",
            "timestamp": "2015-05-01T16:12:26.4670000Z",
            "instrument": "XBTUSD",
            "direction": "buy",
            "currency1": "XBT",
            "currency1Amount": "10.00000000",
            "currency2": "USD",
            "currency2Amount": "1955.3000000000000000",
            "rate": "195.53000000",
            "commissionPaid": "0.00000000",
            "commissionCurrency": "USD",
            "rebatesApplied": "1.95530000",
            "rebateCurrency": "USD"
          }
        ]
      };
      callback(null, response);
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

    it('get trade and returns object', function (done) {
      var tradeObject = {
        raw: {
          id: '248ffda4-83a0-4033-a5bb-8929d523f59f'
        }
      };
      // Call the API endpoint
      ItBitExchange.getTrade(tradeObject, function (err, result) {
        expect(result.externalId).to.equal(getOrderResponse.id);
        expect(result.type).to.equal('limit');
        expect(result.state).to.equal('closed');
        expect(result.baseAmount).to.equal(100000);
        expect(result.baseCurrency).to.equal('BTC');
        expect(result.quoteAmount).to.equal(-215533);
        expect(result.quoteCurrency).to.equal('USD');
        expect(result.feeAmount).to.equal(2);
        expect(result.feeCurrency).to.equal('USD');
        expect(result.limitPrice).to.equal(400.99);

        // Test types
        expect(result.id).to.be.an('undefined');
        expect(result.externalId).to.be.a('string');
        expect(result.type).to.be.a('string');
        expect(result.state).to.be.a('string');
        expect(result.baseAmount).to.be.a('number');
        expect(result.baseCurrency).to.be.a('string');
        expect(result.quoteAmount).to.be.a('number');
        expect(result.quoteCurrency).to.be.a('string');
        expect(result.feeAmount).to.be.a('number');
        expect(result.feeCurrency).to.be.a('string');
        expect(result.limitPrice).to.be.a('number');
        expect(result.raw).to.be.a('object');
        expect(result.createTime).to.be.an('undefined');
        done();
      });
    });
  });

  describe('Closed trade - with no transactions', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getOrder = function (walletId, orderId, callback) {
      var getOrderResponse = {
        id: '248ffda4-83a0-4033-a5bb-8929d523f59f',
        walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
        side: 'buy',
        instrument: 'XBTUSD',
        type: 'limit',
        currency: 'XBT',
        amount: '0.0010',
        price: '400.99',
        amountFilled: '0',
        volumeWeightedAveragePrice: '0',
        createdTime: '2014-02-11T17:05:15Z',
        status: 'filled',
        metadata: {},
        clientOrderIdentifier: ''
      };

      callback(null, getOrderResponse);
    };

    ItBitMock.prototype.getWalletTrades = function (walletId, params, callback) {
      var response = {
        "totalNumberOfRecords": "2",
        "currentPageNumber": "1",
        "latestExecutionId": "332",
        "recordsPerPage": "50",
        "tradingHistory": [
          {
            "orderId": "248ffda4-83a0-4033-a5bb-8929d523f59f",
            "timestamp": "2015-05-11T14:48:01.9870000Z",
            "instrument": "XBTUSD",
            "direction": "buy",
            "currency1": "XBT",
            "currency1Amount": "0.00010000",
            "currency2": "USD",
            "currency2Amount": "200.0250530000000000",
            "rate": "250.53000000",
            "commissionPaid": "0.0200000",
            "commissionCurrency": "USD",
            "rebatesApplied": "-0.000125265",
            "rebateCurrency": "USD"
          },
          {
            "orderId": "248ffda4-83a0-4033-a5bb-8929d523f59f",
            "timestamp": "2015-05-01T16:12:26.4670000Z",
            "instrument": "XBTUSD",
            "direction": "buy",
            "currency1": "XBT",
            "currency1Amount": "10.00000000",
            "currency2": "USD",
            "currency2Amount": "1955.3000000000000000",
            "rate": "195.53000000",
            "commissionPaid": "0.00000000",
            "commissionCurrency": "USD",
            "rebatesApplied": "1.95530000",
            "rebateCurrency": "USD"
          }
        ]
      };
      callback(null, response);
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

    it('get trade and returns object', function (done) {
      var tradeObject = {
        raw: {
          id: '148ffda4-83a0-4033-a5bb-8929d523f59f'
        }
      };
      // Call the API endpoint
      ItBitExchange.getTrade(tradeObject, function (err, result) {
        expect(result).to.equal(undefined);
        expect(err.message).to.equal('No trades are found on ItBit in the time interval' +
          ' (2014-02-11T17:04:15.000Z - 2014-02-11T17:35:15.000Z) for tradeId: 148ffda4-83a0-4033-a5bb-8929d523f59f');
        expect(err.code).to.equal(ErrorCodes.MODULE_ERROR);
        expect(err.cause).to.equal(undefined);
        done();
      });
    });
  });
});
