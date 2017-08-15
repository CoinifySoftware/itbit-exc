var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');
var Helper = require('../lib/helper');

describe('Helper', function () {
  describe('#getUniqueTransactionId', function () {

    var crypto = require('crypto');
    var hash;

    beforeEach(function (done) {
      hash = crypto.createHash('sha256');
      done();
    });

    it('should hash the withdrawalId for a withdrawal', function (done) {
      var tx = {
        destinationAddress: "14TtvNL164g9qEcpZoRbfkPpxJBMWtSyrw",
        withdrawalId: 6721,
        holdingPeriodCompletionDate: "2015-02-04T15:08:41.2170000",
        time: "2015-02-03T15:08:41.2500000",
        currency: "XBT",
        transactionType: "Withdrawal",
        amount: "29.06460000",
        walletName: "Wallet",
        status: "completed"
      };

      var expectedIdentifier = hash.update(tx.withdrawalId.toString()).digest('hex');
      expect(Helper.getUniqueTransactionId(tx)).to.equal(expectedIdentifier);
      done();
    });

    it('should hash the txnHash for a BTC deposit', function (done) {
      var tx = {
        destinationAddress: "1GnAZqEKFfmuDWEWqqJdDzViGXb5js1KEk",
        txnHash: "e0eb1dcf2070c05b23f69ad0d164ff8eb18ca699579562d1f414da457ca3b327",
        time: "2015-06-11T11:52:21.3200000",
        currency: "XBT",
        transactionType: "Deposit",
        amount: "5.00000000",
        walletName: "Wallet",
        status: "completed"
      };

      var expectedIdentifier = hash.update(tx.txnHash).digest('hex');
      expect(Helper.getUniqueTransactionId(tx)).to.equal(expectedIdentifier);
      done();
    });

    it('should hash "time-currency" for a non-BTC deposit', function (done) {
      var tx = {
        "time": "2015-01-06T02:13:09.3770000",
        "currency": "USD",
        "transactionType": "Deposit",
        "amount": "5995.00000000",
        "walletName": "Wallet",
        "status": "completed"
      };

      var expectedIdentifier = hash.update(tx.time + '-' + tx.currency).digest('hex');
      expect(Helper.getUniqueTransactionId(tx)).to.equal(expectedIdentifier);
      done();
    });

    it('should throw an error for unknown cases', function (done) {
      var tx = {};

      try {
        Helper.getUniqueTransactionId(tx);
      } catch (e) {
        expect(e).to.be.instanceof(TypeError);
        return done();
      }

      /* No exception */
      done(new Error('No exception thrown'));
    });
  });
});

