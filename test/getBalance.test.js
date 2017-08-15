var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('getBalance', function() {
  describe('Success', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    // Mock for ItBit getWallet()
    ItBitMock.prototype.getWallet = function (walletId, callback) {
      //expect(walletId).to.equal();
      var response = {
        id: "7e037345-1288-4c39-12fe-d0f99a475a98",
        userId: "5591e419-a356-4fc0-b43c-3c84c2fd8013",
        name: "My New Wallet",
        balances: [
          {
            currency: "USD",
            availableBalance: "50000.0000000",
            totalBalance: "50000.0000000"
          },
          {
            currency: "XBT",
            availableBalance: "100.0000010",
            totalBalance: "100.0000000"
          },
          {
            currency: "EUR",
            availableBalance: "100.0000000",
            totalBalance: "100.0000000"
          },
          {
            currency: "SGD",
            availableBalance: "100.0000000",
            totalBalance: "100.0000000"
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

    it('gets the balance and returns an object', function (done) {
      ItBitExchange.getBalance(function (err, result) {
        expect(result.available['USD']).to.equal(5000000);
        expect(result.available['BTC']).to.equal(10000000100);
        expect(result.total['SGD']).to.equal(10000);
        expect(result.total['EUR']).to.equal(10000);
        done();
      });
    });
  });

  describe('Error', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    // Mock for ItBit getWallet()
    ItBitMock.prototype.getWallet = function (walletId, callback) {
      //expect(walletId).to.equal();

      callback(new Error("You did something wrong..."), null);
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

    it('gets the balance and ItBit returns an error', function(done){
      ItBitExchange.getBalance(function(err, result) {
        expect(result).to.equal(undefined);
        expect(err.message).to.equal('There is an error in the response from the ItBit service...');
        expect(err.code).to.equal(ErrorCodes.EXCHANGE_SERVER_ERROR);
        expect(err.cause.message).to.equal('You did something wrong...');

        done();
      })
    });
  });

  describe('Error - no walletId', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
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
        secret: 'mock_secret'
      });
    });

    after(function () {
      mockery.deregisterAll();
      mockery.disable();
    });

    it('gets the balance and ItBit returns an error', function(done){
      ItBitExchange.getBalance(function(err, result) {
        expect(result).to.equal(undefined);
        expect(err.message).to.equal('Function requires argument in constructor: settings.walletId');
        expect(err.code).to.equal(ErrorCodes.MODULE_ERROR);

        done();
      })
    });
  });
});

