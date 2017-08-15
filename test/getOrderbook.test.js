var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('getOrderbook', function() {
  describe('Success', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getOrderBook = function (pair, callback) {
      var response = {
        "asks": [
          [
            "219.82",
            "2.19"
          ],
          [
            "219.83",
            "6.05"
          ]
        ],
        "bids": [
          [
            "219.40",
            "17.46"
          ],
          [
            "219.13",
            "53.93"
          ]
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
      ItBitExchange.getOrderBook('BTC', 'USD', function (err, result) {
        // Result
        expect(result.asks[0].baseAmount).to.equal(219000000);
        expect(result.asks[0].price).to.equal(219.82);
        expect(result.bids[0].baseAmount).to.equal(1746000000);
        expect(result.bids[0].price).to.equal(219.4);

        // Types
        expect(result.asks[0].price).to.be.a('number');
        expect(result.asks[0].baseAmount).to.be.a('number');
        expect(result.bids[0].price).to.be.a('number');
        expect(result.bids[0].baseAmount).to.be.a('number');
        expect(result.baseCurrency).to.be.a('string');
        expect(result.quoteCurrency).to.be.a('string');

        done();
      });
    });
  });
});

