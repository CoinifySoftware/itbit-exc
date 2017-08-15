var mockery = require("mockery");
var expect = require("chai").expect;
var ErrorCodes = require('../lib/error_codes');

describe('listTransactions', function() {
  describe('One response from ItBit', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getFundingHistory = function (walletId, params, callback) {
      var response = {
        "totalNumberOfRecords": "2",
        "currentPageNumber": "1",
        "latestExecutionId": "332",
        "recordsPerPage": "50",
        "fundingHistory": [
          {
            "bankName": "fb6",
            "withdrawalId": 94,
            "holdingPeriodCompletionDate": "2015-03-21T17:37:39.9170000",
            "time": "2015-03-18T17:37:39.9170000",
            "currency": "EUR",
            "transactionType": "Withdrawal",
            "amount": "1.00000000",
            "walletName": "Wallet",
            "status": "relayed"
          },
          {
            "bankName": "test",
            "withdrawalId": 19,
            "holdingPeriodCompletionDate": "2015-02-21T23:43:37.1230000",
            "time": "2015-02-18T23:43:37.1230000",
            "currency": "EUR",
            "transactionType": "Withdrawal",
            "amount": "100.00000000",
            "walletName": "Wallet",
            "status": "completed"
          },
          {
            "destinationAddress": "mfsANnSPCgeRZoc8KYwCA71mmQMuKjUgFJ",
            "txnHash": "b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f",
            "time": "2015-02-04T18:52:39.1270000",
            "currency": "XBT",
            "transactionType": "Deposit",
            "amount": "14.89980000",
            "walletName": "Wallet",
            "status": "completed"
          },
          {
            "bankName": "test",
            "withdrawalId": 21,
            "holdingPeriodCompletionDate": "2015-02-21:49:29.1370000",
            "time": "2015-01-18T23:49:29.1370000",
            "currency": "EUR",
            "transactionType": "Withdrawal",
            "amount": "0.01000000",
            "walletName": "Wallet",
            "status": "cancelled"
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

    it('latestTransaction is null', function (done) {
      ItBitExchange.listTransactions(null, function (err, result) {
        // Returns all objects
        expect(result.length).to.equal(4);


        // Test first object in list
        expect(result[0].externalId.length).to.equal(64);
        expect(result[0].timestamp).to.equal('2015-03-18T17:37:39.917Z');
        expect(result[0].state).to.equal('relayed');
        // Negative amount because type is withdrawal
        expect(result[0].amount).to.equal(-100);
        expect(result[0].currency).to.equal('EUR');
        expect(result[0].type).to.equal('withdrawal');

        // Test types
        expect(result[0].id).to.be.an('undefined');
        expect(result[0].externalId).to.be.a('string');
        expect(result[0].timestamp).to.be.a('string');
        expect(result[0].state).to.be.a('string');
        expect(result[0].amount).to.be.a('number');
        expect(result[0].currency).to.be.a('string');
        expect(result[0].type).to.be.a('string');
        if (result[0].btcTxId) {
          expect(result[0].btcTxId).to.be.a('string');
        }
        expect(result[0].raw).to.be.a('object');
        expect(result[0].createTime).to.be.a('undefined');


        // Test object three (index 2) - which is a deposit
        expect(result[2].externalId.length).to.equal(64);
        expect(result[2].timestamp).to.equal('2015-02-04T18:52:39.127Z');
        expect(result[2].state).to.equal('completed');
        // Positive amount because type is deposit
        expect(result[2].amount).to.equal(1489980000);
        expect(result[2].currency).to.equal('BTC');
        expect(result[2].type).to.equal('deposit');
        expect(result[2].chainTxId).to.equal('b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f');

        // Test types
        expect(result[2].id).to.be.an('undefined');
        expect(result[2].externalId).to.be.a('string');
        expect(result[2].timestamp).to.be.a('string');
        expect(result[2].state).to.be.a('string');
        expect(result[2].amount).to.be.a('number');
        expect(result[2].currency).to.be.a('string');
        expect(result[2].type).to.be.a('string');
        expect(result[2].chainTxId).to.be.a('string');
        expect(result[2].raw).to.be.a('object');
        expect(result[2].createTime).to.be.a('undefined');

        done();
      });
    });

    it('latestTransaction is object', function (done) {
      var latestTransaction = {
        amount: 1490,
        currency: 'XBT',
        type: 'deposit',
        btcTxId: 'b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f',
        raw:
        { destinationAddress: 'mfsANnSPCgeRZoc8KYwCA71mmQMuKjUgFJ',
          txnHash: 'b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f',
          time: '2015-02-04T18:52:39.1270000',
          currency: 'XBT',
          transactionType: 'Deposit',
          amount: '14.89980000',
          walletName: 'Wallet',
          status: 'completed' }
      };

      ItBitExchange.listTransactions(latestTransaction, function (err, result) {
        // Returns all objects - include latestTransaction
        expect(result.length).to.equal(3);

        // Test first object in list
        expect(result[0].externalId.length).to.equal(64);
        expect(result[0].timestamp).to.equal('2015-03-18T17:37:39.917Z');
        expect(result[0].state).to.equal('relayed');
        // Negative amount because type is withdrawal
        expect(result[0].amount).to.equal(-100);
        expect(result[0].currency).to.equal('EUR');
        expect(result[0].type).to.equal('withdrawal');

        expect(result[0].id).to.be.an('undefined');
        expect(result[0].externalId).to.be.a('string');
        expect(result[0].timestamp).to.be.a('string');
        expect(result[0].state).to.be.a('string');
        expect(result[0].amount).to.be.a('number');
        expect(result[0].currency).to.be.a('string');
        expect(result[0].type).to.be.a('string');
        expect(result[0].chainTxId).to.be.an('undefined');
        expect(result[0].raw).to.be.a('object');
        expect(result[0].createTime).to.be.a('undefined');

        done();
      });
    });
  });

  describe('More responses from ItBit', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getFundingHistory = function (walletId, params, callback) {
      var response;
      switch (params.page) {
        case 1:
          response = {
            "totalNumberOfRecords": "4",
            "currentPageNumber": "1",
            "latestExecutionId": "332",
            "recordsPerPage": "1",
            "fundingHistory": [
              {
                "bankName": "fb6",
                "withdrawalId": 94,
                "holdingPeriodCompletionDate": "2015-03-21T17:37:39.9170000",
                "time": "2015-03-18T17:37:39.9170000",
                "currency": "EUR",
                "transactionType": "Withdrawal",
                "amount": "1.00000000",
                "walletName": "Wallet",
                "status": "relayed"
              }
            ]
          };
          break;
        case 2:
          response = {
            "totalNumberOfRecords": "4",
            "currentPageNumber": "2",
            "latestExecutionId": "332",
            "recordsPerPage": "1",
            "fundingHistory": [
              {
                "bankName": "test",
                "withdrawalId": 19,
                "holdingPeriodCompletionDate": "2015-02-21T23:43:37.1230000",
                "time": "2015-02-18T23:43:37.1230000",
                "currency": "EUR",
                "transactionType": "Withdrawal",
                "amount": "100.00000000",
                "walletName": "Wallet",
                "status": "completed"
              }
            ]
          };
          break;
        case 3:
          response = {
            "totalNumberOfRecords": "4",
            "currentPageNumber": "3",
            "latestExecutionId": "332",
            "recordsPerPage": "1",
            "fundingHistory": [
              {
                "destinationAddress": "mfsANnSPCgeRZoc8KYwCA71mmQMuKjUgFJ",
                "txnHash": "b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f",
                "time": "2015-02-04T18:52:39.1270000",
                "currency": "XBT",
                "transactionType": "Deposit",
                "amount": "14.89980000",
                "walletName": "Wallet",
                "status": "completed"
              }
            ]
          };
          break;
        case 4:
          response = {
            "totalNumberOfRecords": "4",
            "currentPageNumber": "4",
            "latestExecutionId": "332",
            "recordsPerPage": "1",
            "fundingHistory": [
              {
                "bankName": "test",
                "withdrawalId": 21,
                "holdingPeriodCompletionDate": "2015-02-21:49:29.1370000",
                "time": "2015-02-01T23:49:29.1370000",
                "currency": "EUR",
                "transactionType": "Withdrawal",
                "amount": "0.01000000",
                "walletName": "Wallet",
                "status": "cancelled"
              }
            ]
          };
          break;
      }

      return callback(null, response);
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

    it('latestTransaction is null', function (done) {
      ItBitExchange.listTransactions(null, function (err, result) {
        // Returns all objects
        expect(result.length).to.equal(4);

        // Test first object in list
        expect(result[0].timestamp).to.equal('2015-03-18T17:37:39.917Z');
        // Negative amount because type is withdrawal
        expect(result[0].amount).to.equal(-100);
        expect(result[0].currency).to.equal('EUR');
        expect(result[0].type).to.equal('withdrawal');

        // Test types
        expect(result[0].id).to.be.an('undefined');
        expect(result[0].timestamp).to.be.a('string');
        expect(result[0].amount).to.be.a('number');
        expect(result[0].currency).to.be.a('string');
        expect(result[0].type).to.be.a('string');
        if (result[0].btcTxId) {
          expect(result[0].btcTxId).to.be.a('string');
        }
        expect(result[0].raw).to.be.a('object');
        expect(result[0].createTime).to.be.an('undefined');


        // Test object three (index 2) - which is a deposit
        expect(result[2].externalId.length).to.equal(64);
        expect(result[2].timestamp).to.equal('2015-02-04T18:52:39.127Z');
        expect(result[2].state).to.equal('completed');
        // Positive amount because type is deposit
        expect(result[2].amount).to.equal(1489980000);
        expect(result[2].currency).to.equal('BTC');
        expect(result[2].type).to.equal('deposit');
        expect(result[2].chainTxId).to.equal('b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f');

        // Test types
        expect(result[2].id).to.be.an('undefined');
        expect(result[2].externalId).to.be.a('string');
        expect(result[2].timestamp).to.be.a('string');
        expect(result[2].state).to.be.a('string');
        expect(result[2].amount).to.be.a('number');
        expect(result[2].currency).to.be.a('string');
        expect(result[2].type).to.be.a('string');
        expect(result[2].chainTxId).to.be.a('string');
        expect(result[2].raw).to.be.a('object');
        expect(result[2].createTime).to.be.a('undefined');

        done();
      });
    });

    it('latestTransaction is object', function (done) {
      var latestTransaction = {
        amount: 1490,
        currency: 'XBT',
        type: 'deposit',
        btcTxId: 'b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f',
        raw:
        { destinationAddress: 'mfsANnSPCgeRZoc8KYwCA71mmQMuKjUgFJ',
          txnHash: 'b77ded847997fa52cb340aa65239990d71e02ce335430bab19c20a4c3e84e48f',
          time: '2015-02-04T18:52:39.1270000',
          currency: 'XBT',
          transactionType: 'Deposit',
          amount: '14.89980000',
          walletName: 'Wallet',
          status: 'completed' }
      };

      ItBitExchange.listTransactions(latestTransaction, function (err, result) {
        // Returns all objects - latestTransaction should be included
        expect(result.length).to.equal(3);
        // Test first object in list
        expect(result[0].timestamp).to.equal('2015-03-18T17:37:39.917Z');
        // Negative amount because type is withdrawal
        expect(result[0].amount).to.equal(-100);
        expect(result[0].currency).to.equal('EUR');
        expect(result[0].type).to.equal('withdrawal');

        // Test types
        expect(result[0].id).to.be.an('undefined');
        expect(result[0].timestamp).to.be.a('string');
        expect(result[0].amount).to.be.a('number');
        expect(result[0].currency).to.be.a('string');
        expect(result[0].type).to.be.a('string');
        if (result[0].btcTxId) {
          expect(result[0].btcTxId).to.be.a('string');
        }
        expect(result[0].raw).to.be.a('object');
        expect(result[0].createTime).to.be.a('undefined');
        done();
      });
    });
  });

  describe('Error from ItBit API', function () {
    var ItBitExchange;

    // ItBit constructor
    var ItBitMock = function ItBitMock(settings) {
    };

    ItBitMock.prototype.getFundingHistory = function (walletId, params, callback) {
      var response;
      switch (params.page) {
        case 1:
          response = {
            "totalNumberOfRecords": "4",
            "currentPageNumber": "1",
            "latestExecutionId": "332",
            "recordsPerPage": "1",
            "fundingHistory": [
              {
                "bankName": "fb6",
                "withdrawalId": 94,
                "holdingPeriodCompletionDate": "2015-03-21T17:37:39.9170000",
                "time": "2015-03-18T17:37:39.9170000",
                "currency": "EUR",
                "transactionType": "Withdrawal",
                "amount": "1.00000000",
                "walletName": "Wallet",
                "status": "relayed"
              }
            ]
          };
          break;
        case 2:
          return callback(new Error("An error happened here"), null);
        case 3:
          // This should never be called
          expect(1).to.equal(2);
          break;
        case 4:
          // This should never be called
          expect(1).to.equal(2);
          break
      }

      return callback(null, response);
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

    it('latestTransaction is null', function (done) {
      ItBitExchange.listTransactions(null, function (err, result) {
        expect(result).to.equal(undefined);
        expect(err.message).to.equal('There is an error in the response from the ItBit service...');
        expect(err.code).to.equal(ErrorCodes.EXCHANGE_SERVER_ERROR);
        expect(err.cause.message).to.equal('An error happened here');
        done();
      });
    });
  });
});
