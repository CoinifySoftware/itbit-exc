var async = require('async');
var ItBit = require('itbit');
var Currency = require('./lib/currency');
var Helper = require('./lib/helper');
var ErrorCodes = require('./lib/error_codes');

/*
 * The max and min range we search for trades belonging to an ItBit order
 * in getTrade() function. The time is before and after order create time.
 */
const DEFAULT_TIME_RANGE_BEFORE_CREATED_IN_MILLIS = 60000; // 1 min.
const DEFAULT_TIME_RANGE_AFTER_CREATED_IN_MILLIS = 1800000; // 30 min.

/**
 * This exchange is based on the ItBit API with a simple interface
 *
 * Example of settings
 * {
 *  key:      <api_key>,
    secret:   <api_secret>,
    walletId: <wallet_id>,
    server:   <api_base_url>, // optional, default "https://api.itbit.com/v1",
    timeRangeBeforeCreatedInMillis // optional, default 60000
    timeRangeAfterCreatedInMillis // optional, default 1800000
 * }
 *
 * @param {Object} settings
 * @constructor
 */
var ItBitExchange = function ItBitExchange(settings) {
  /*
   * Init ItBit API
   */
  this.ItBit = new ItBit(settings);


  this.key = settings.key;
  this.secret = settings.secret;
  this.walletId = settings.walletId;

  this.timeRangeBeforeCreatedInMillis =
    settings.timeRangeBeforeCreatedInMillis || DEFAULT_TIME_RANGE_BEFORE_CREATED_IN_MILLIS;

  this.timeRangeAfterCreatedInMillis =
    settings.timeRangeAfterCreatedInMillis || DEFAULT_TIME_RANGE_AFTER_CREATED_IN_MILLIS;

  this.log = settings.log || require('console-log-level')({});
};

/**
 * Place a market order on the exchange
 *
 * @param {number} baseAmount     The amount to buy or sell at the exchange. If negative amount its a sell order.
 * @param {number} limitPrice     The minimum/maximum rate you want to sell or buy for
 * @param {string} baseCurrency   The currency of the baseAmount
 * @param {string} quoteCurrency  The currency we want to trade to/for
 * @param callback
 */
ItBitExchange.prototype.placeTrade = function (baseAmount, limitPrice, baseCurrency, quoteCurrency, callback) {
  /*
   * Check if credentials are provided and return callback with error if not
   */
  if (this._checkIfCredentialsIsProvided()) {
    return callback(this._checkIfCredentialsIsProvided());
  }


  if (baseAmount === undefined || typeof baseAmount !== 'number' || baseAmount === 0) {
    return callback(constructError('The base amount must be a number',
      ErrorCodes.MODULE_ERROR));
  }

  if (limitPrice === undefined || typeof limitPrice !== 'number' || limitPrice <= 0) {
    return callback(constructError('The limit price must be a positive number',
      ErrorCodes.MODULE_ERROR));
  }
  // API call fails if there is more than 2 decimals of precision in limitPrice
  limitPrice = Math.round(100 * limitPrice) / 100;

  // If baseAmount is negative its a sell order and if positive a buy order
  var side = (baseAmount > 0) ? 'buy' : 'sell';

  // This is a limit order
  var type = 'limit';
  // Convert amount from sub-unit to real unit
  var amountMainUnit = Currency.fromSmallestSubUnit(baseAmount, baseCurrency);

  // ItBit only supports 4 decimals, so we always round down
  if (baseCurrency === 'BTC') {
    var amountMainUnitRounded = parseInt(10000 * amountMainUnit) / 10000;

    // Log rounding if original amount changes
    if (amountMainUnit !== parseFloat(amountMainUnitRounded).toFixed(8)) {
      this.log.info("the base amount in placeTrade of " + baseAmount + " Satoshis is rounded to " + amountMainUnitRounded + " BTC");
    }

    amountMainUnit = amountMainUnitRounded;
  }

  // ItBit only handles positive values
  amountMainUnit = Math.abs(amountMainUnit);

  // BTC symbol is XBT in ItBit API
  var instrument = Helper.normalizeCurrencyItBit(baseCurrency) + quoteCurrency;

  /**
   * ItBit.addOrder() places an order on the ItBit exchange
   *
   * @param {string}      walletId              ID of the exchange wallet
   * @param {string}      side                  Can be either 'sell' or 'buy'
   * @param {string}      type                  Always 'limit'
   * @param {string}      amount                Order amount; maximum of 4 decimal places of precision
   * @param {string}      limitPrice            Order price; maximum of 2 decimal places of precision
   * @param {string}      instrument            Currency pair (ex. 'XBTUSD')
   * @param {object|null} metadata              Storage for client order information
   * @param {string|null} clientOrderIdentifier Unique client order identifier
   */
  this.ItBit.addOrder(this.walletId, side, type, amountMainUnit, limitPrice, instrument, null, null, function (err, response) {
    if (err) {
      return callback(constructError('There is an error in the response from the ItBit service...',
        ErrorCodes.EXCHANGE_SERVER_ERROR, err));
    }

    try {
      var trade = Helper.parseOpenOrder(response);
    }
    catch (e) {
      return callback(constructError('The response from ItBit addOrder() could not be parsed',
        ErrorCodes.MODULE_ERROR, e));
    }

    callback(null, trade);
  });
};

/**
 * Get our account balances on the exchange
 *
 * @param callback
 */
ItBitExchange.prototype.getBalance = function (callback) {
  /*
   * Check if credentials are provided and return callback with error if not
   */
  if (this._checkIfCredentialsIsProvided()) {
    return callback(this._checkIfCredentialsIsProvided());
  }

  this.ItBit.getWallet(this.walletId, function (err, response) {
    if (err) {
      return callback(constructError('There is an error in the response from the ItBit service...',
        ErrorCodes.EXCHANGE_SERVER_ERROR, err));
    }

    try {
      var balance = Helper.parseBalance(response);
    }
    catch (e) {
      return callback(constructError('The response from ItBit getBalance() could not be parsed',
        ErrorCodes.MODULE_ERROR, e));
    }

    callback(null, balance);
  })
};

/**
 * List all transactions (both deposits and withdrawals) from our account/wallet on this exchange,
 * whether they are bitcoin transactions or fiat transactions.
 *
 * The ItBit API only allow 50 results per page. To get all results we call their API multiple times
 * until there are no more results left or if latestTransaction is provided, we stop when there
 * are no more newer transactions then the latestTransaction.
 *
 * If latestTransaction is provided it will only return transactions newer than this one.
 * If null return all transactions. This object must come from an earlier call to listTransactions()
 *
 * Example of a latestTransaction object:
 * {
 *   amount: 10000,
 *   currency: 'EUR',
 *   type: 'withdrawal',
 *   raw:
 *    { bankName: 'test',
 *      withdrawalId: 19,
 *      holdingPeriodCompletionDate: '2015-02-21T23:43:37.1230000',
 *      time: '2015-02-18T23:43:37.1230000',
 *      currency: 'EUR',
 *      transactionType: 'Withdrawal',
 *      amount: '100.00000000',
 *      walletName: 'Wallet',
 *      status: 'completed' }
 * }
 *
 * @param {object|null} latestTransaction of type transaction object or null
 * @param callback
 */
ItBitExchange.prototype.listTransactions = function (latestTransaction, callback) {
  var _this = this;
  /*
   * Check if credentials are provided and return callback with error if not
   */
  if (this._checkIfCredentialsIsProvided()) {
    return callback(this._checkIfCredentialsIsProvided());
  }

  var result = [];
  var totalPages = null;
  var limitReached = false;

  var currentPage = 1;
  var perPage = 50;

  var callAPI = function (asyncCallback) {
    var params = {};

    params.page = currentPage;
    params.perPage = perPage;

    /**
     * ItBit.getFundingHistory() Gets deposits and withdrawals for the specified exchange wallet
     *
     * @param {string} walletId  ID of the exchange wallet
     * @param {object} params    Params can be 'page' and 'perPage'
     */
    _this.ItBit.getFundingHistory(_this.walletId, params, function (err, data) {
      if (err) {
        return asyncCallback(constructError('There is an error in the response from the ItBit service...',
          ErrorCodes.EXCHANGE_SERVER_ERROR, err));
      }

      data.fundingHistory.forEach(function (transaction) {
        /*
         * Return if limit is reached
         */
        if (limitReached) {
          return;
        }

        /*
         * If transaction time is later than the latestTransaction - don't include the result and
         * End loop by setting limitReached true
         */
        if (latestTransaction && (latestTransaction.raw.time > transaction.time)) {
          limitReached = true;
          return;
        }

        result.push(transaction);
      });

      currentPage = data.currentPageNumber;
      totalPages = Math.ceil(data.totalNumberOfRecords / data.recordsPerPage);

      /*
       * Limit is reached when there are no more pages or no more new transactions
       */
      limitReached = limitReached || ++currentPage > totalPages;

      asyncCallback(null, result);
    });
  };

  /*
   * Returns false if there are no more pages left
   */
  var check = function () {
    return !limitReached;
  };

  var done = function (err, result) {
    if (err) {
      return callback(err);
    }
    /*
     * Parse result from ItBit
     */
    try {
      var parsedResult = result.map(function(txObject) {
        return Helper.parseTransaction(txObject, _this.log);
      });
    } catch (e) {
      return callback(constructError('The response from ItBit getFundingHistory() could not be parsed',
        ErrorCodes.MODULE_ERROR, e));
    }

    callback(err, parsedResult);
  };

  async.doWhilst(callAPI, check, done);
};

/**
 * Get a Trade from the exchange
 *
 * You have to provide a trade object from a previous call to placeTrade() or getTrade().
 *
 * Example of a trade object:
 * {
 *  type: 'limit',
 *  state: 'open',
 *  baseAmount: 12340000,
 *  baseCurrency: 'BTC',
 *  quoteCurrency: 'USD',
 *  limitPrice: 400.99,
 *  raw:
 *    { id: '5b1f51e1-3f38-4d64-918c-45c5848c76fb',
 *      walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
 *      side: 'buy',
 *      instrument: 'XBTUSD',
 *      type: 'limit',
 *      currency: 'XBT',
 *      amount: '0.1234',
 *      price: 400.99,
 *      amountFilled: '0',
 *      volumeWeightedAveragePrice: '0',
 *      createdTime: '2014-02-11T17:05:15Z',
 *      status: 'submitted',
 *      metadata: {},
 *      clientOrderIdentifier: ''
 *  }
 * }
 *
 * @param {Object} trade Trade object from previous call to placeTrade() or getTrade()
 * @param callback
 */
ItBitExchange.prototype.getTrade = function (trade, callback) {
  var _this = this;
  /*
   * Check if credentials are provided and return callback with error if not
   */
  if (this._checkIfCredentialsIsProvided()) {
    return callback(this._checkIfCredentialsIsProvided());
  }

  if (!trade || typeof trade !== 'object') {
    return callback(constructError('trade must be an object',
      ErrorCodes.MODULE_ERROR));
  }

  var currentPage = 1;
  var perPage = 50;

  var totalPages = null;

  /**
   * ItBit.getOrder() Gets an order by id
   *
   * @param {string} walletId  ID of the exchange wallet
   * @param {number} orderId   Id of the order
   */
  this.ItBit.getOrder(this.walletId, trade.raw.id, function (err, orderResult) {
    if (err) {
      return callback(constructError('There is an error in the response from the ItBit service...',
        ErrorCodes.EXCHANGE_SERVER_ERROR, err));
    }

    /*
     * If order is not filled - return
     */
    if (orderResult.status !== 'filled') {
      try {
        var tradeEntry = Helper.parseOpenOrder(orderResult);
      }
      catch (e) {
        return callback(constructError('The response from ItBit getOrder() could not be parsed',
          ErrorCodes.MODULE_ERROR, e));
      }

      return callback(null, tradeEntry);
    }

    /*
     * If order exists and is filled we find the trades belonging to this order
     * and add the values. The getTrades API is called with a time range.
     *
     * Subtract and add time to time created to calculate the time range
     */
    var startTime = new Date(orderResult.createdTime).getTime() - _this.timeRangeBeforeCreatedInMillis;
    var endTime = new Date(orderResult.createdTime).getTime() + _this.timeRangeAfterCreatedInMillis;

    /*
     * Convert to ISO 8601 format
     */
    var rangeStart = new Date(startTime).toISOString();
    var rangeEnd = new Date(endTime).toISOString();

    var tradeResults = [];

    /*
     * Call ItBit API and add the trade objects to tradeResults
     */
    var callAPI = function (asyncCallback) {
      var params = {};

      params.page = currentPage;
      params.perPage = perPage;
      params.rangeStart = rangeStart;
      params.rangeEnd = rangeEnd;

      /**
       * ItBit.getWalletTrades() Get all trades for the specified wallet
       *
       * @param {string} walletId ID of the exchange wallet
       * @param {Object} params   Available params: 'page', 'perPage', 'rangeStart', 'rangeEnd'
       */
      _this.ItBit.getWalletTrades(_this.walletId, params, function (err, data) {
        if (err) {
          return asyncCallback(constructError('There is an error in the response from the ItBit service...',
            ErrorCodes.EXCHANGE_SERVER_ERROR, err));
        }

        // Find transactions referencing the order
        var newTradeResults = data.tradingHistory.filter( function( walletTrade ) { return walletTrade.orderId === trade.raw.id; } );
        // Append the transactions to the existing list of transactions
        Array.prototype.push.apply( tradeResults, newTradeResults );

        currentPage = data.currentPageNumber;
        totalPages = Math.ceil(data.totalNumberOfRecords / data.recordsPerPage);
        currentPage++;

        asyncCallback(null, tradeResults);
      });
    };

    /*
     * Returns false if the current page exceeds the total pages
     */
    var check = function () {
      return (currentPage <= totalPages);
    };

    /*
     * Adds to results, parses and returns the trade object
     */
    var done = function (err, tradeResults) {
      if (err) {
        return callback(err);
      }
      /*
       * If no ItBit trades are found for the given time interval we log and return the error
       * with time interval and trade/order ID
       */
      if (tradeResults.length === 0) {
        return callback(constructError('No trades are found on ItBit in the time interval ' +
          '(' + rangeStart + ' - ' + rangeEnd + ') for tradeId: ' + trade.raw.id,
          ErrorCodes.MODULE_ERROR));
      }
      /*
       * return parsed order object with new tradeResults
       */
      try {
        var tradeResult = Helper.parseClosedOrder(orderResult, tradeResults);
      }
      catch (e) {
        return callback(constructError('The response from ItBit getWalletTrades() could not be parsed',
          ErrorCodes.MODULE_ERROR, e));
      }
      callback(err, tradeResult);
    };

    async.doWhilst(callAPI, check, done);
  });
};

/**
 * Get the order book from the exchange
 *
 * @param {string} baseCurrency
 * @param {string} quoteCurrency
 * @param callback
 */
ItBitExchange.prototype.getOrderBook = function (baseCurrency, quoteCurrency, callback) {
  // BTC symbol is XBT in ItBit API
  var apiBaseCurrency = (baseCurrency === 'BTC') ? 'XBT' : baseCurrency;

  /**
   * ItBit.getOrderBook() Get the full order book for the specified market.
   *
   * @param {string} tickerSymbol CurrencyPair (ex. 'XBTUSD')
   */
  this.ItBit.getOrderBook(apiBaseCurrency + quoteCurrency, function (err, data) {
    if (err) {
      return callback(constructError('There is an error in the response from the ItBit service...',
        ErrorCodes.EXCHANGE_SERVER_ERROR, err));
    }

    try {
      var orderbookResult = Helper.parseOrderBook(data, baseCurrency, quoteCurrency);
    }
    catch (e) {
      return callback(constructError('The response from ItBit getOrderBook() could not be parsed',
        ErrorCodes.MODULE_ERROR, e));
    }

    callback(err, orderbookResult);
  });
};

/**
 * Get ticker data from the exchange
 *
 * @param {string} baseCurrency
 * @param {string} quoteCurrency
 * @param callback
 */
ItBitExchange.prototype.getTicker = function (baseCurrency, quoteCurrency, callback) {
  // BTC symbol is XBT in ItBit API
  var apiBaseCurrency = (baseCurrency === 'BTC') ? 'XBT' : baseCurrency;

  /**
   * ItBit.getTicker() Get the full ticker object for the specified market.
   *
   * @param {string} tickerSymbol CurrencyPair (ex. 'XBTUSD')
   */
  this.ItBit.getTicker(apiBaseCurrency + quoteCurrency, function (err, result) {
    if (err) {
      return callback(constructError('There is an error in the response from the ItBit service...',
        ErrorCodes.EXCHANGE_SERVER_ERROR, err));
    }

    /*
     * Construct result object
     */
    var ticker = {
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency,
      bid: parseFloat(result.bid),
      ask: parseFloat(result.ask),
      lastPrice: parseFloat(result.lastPrice),
      high24Hours: parseFloat(result.high24h),
      low24Hours: parseFloat(result.low24h),
      vwap24Hours: parseFloat(result.vwap24h),
      volume24Hours: Currency.toSmallestSubUnit(parseFloat(result.volume24h), baseCurrency),
    };

    /*
     * Return result object
     */
    return callback(null, ticker);
  });
};

/**
 * Checks for credentials before calling private ItBit endpoints
 * Returns Error object if credentials are not provided
 *
 * @returns {Object|null}
 */
ItBitExchange.prototype._checkIfCredentialsIsProvided = function () {
  var errorMessage = '';

  if (!this.key) {
    errorMessage = 'Function requires argument in constructor: settings.key';
  }

  if (!this.secret) {
    errorMessage = 'Function requires argument in constructor: settings.secret';
  }

  if (!this.walletId) {
    errorMessage = 'Function requires argument in constructor: settings.walletId';
  }

  if (errorMessage) {
    return constructError(errorMessage, ErrorCodes.MODULE_ERROR);
  }

  return null;
};

/**
 * Constructs and returns an Error node.js native object, attaches a message and a pre-declared error code to it,
 * and the original error data, if provided.
 * @param {string}        message     Human readable error message
 * @param {string}        errorCode   Machine readable error message code
 * @param {object|string} errorCause  The raw/original error data (message or an object of messages) that the system
 *                                    responded with and provides detailed information about the cause of the error
 * @returns {Error}
 */
var constructError = function constructError(message, errorCode, errorCause) {
  var error = new Error(message);
  error.code = errorCode;
  if (errorCause) {
    error.cause = errorCause;
  }
  return error;
};

module.exports = ItBitExchange;
