var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('getTicker', function() {
  describe('Success', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getTicker = function (pair, callback) {
      var response = {
        "pair":"XBTUSD",
        "bid":"600.43",
        "bidAmt":"10",
        "ask":"600.92",
        "askAmt":"1.203",
        "lastPrice":"600.02000000",
        "lastAmt":"42.71220000",
        "volume24h":"4371.91560000",
        "volumeToday":"3576.68220000",
        "high24h":"602.61000000",
        "low24h":"583.57000000",
        "highToday":"602.61000000",
        "lowToday":"583.57000000",
        "openToday":"584.58000000",
        "vwapToday":"591.46990345",
        "vwap24h":"590.70736706",
        "serverTimeUTC":"2016-08-10T14:45:48.4346286Z"
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

    it('gets the ticker data and returns an object', function (done) {
      ItBitExchange.getTicker('BTC', 'USD', function (err, ticker) {
        if (err) {
          return done(err);
        }

        expect(ticker).to.be.an('object');

        expect(ticker).to.have.property('baseCurrency');
        expect(ticker).to.have.property('quoteCurrency');
        expect(ticker).to.have.property('bid');
        expect(ticker).to.have.property('ask');
        expect(ticker).to.have.property('lastPrice');
        expect(ticker).to.have.property('high24Hours');
        expect(ticker).to.have.property('low24Hours');
        expect(ticker).to.have.property('vwap24Hours');
        expect(ticker).to.have.property('volume24Hours');

        expect(ticker.baseCurrency).to.equal('BTC');
        expect(ticker.quoteCurrency).to.equal('USD');

        expect(ticker.bid).to.equal(600.43);
        expect(ticker.ask).to.equal(600.92);
        expect(ticker.lastPrice).to.equal(600.02);
        expect(ticker.high24Hours).to.equal(602.61);
        expect(ticker.low24Hours).to.equal(583.57);
        expect(ticker.vwap24Hours).to.equal(590.70736706);
        expect(ticker.volume24Hours).to.equal(437191560000);

        done();
      });
    });
  });
});

