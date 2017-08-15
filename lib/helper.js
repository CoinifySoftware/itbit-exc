
var Currency = require('./currency.js');

/**
 * Parses an open order object in ItBit style to a object in the interface format
 *
 * Example of input object:
 * {
 *  id: '5b1f51e1-3f38-4d64-918c-45c5848c76fb',
 *  walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
 *  side: 'buy',
 *  instrument: 'XBTUSD',
 *  type: 'limit',
 *  currency: 'XBT',
 *  amount: '0.0010',
 *  price: '400',
 *  amountFilled: '0',
 *  volumeWeightedAveragePrice: '0',
 *  createdTime: '2014-02-11T17:05:15Z',
 *  status: 'submitted',
 *  metadata: {},
 *  clientOrderIdentifier: ''
 * }
 *
 * Example of return object
 * {
 *  id: '5b1f51e1-3f38-4d64-918c-45c5848c76fb',
 *  type: 'limit',
 *  baseAmount: 100000, // In smallest sub-unit
 *  baseCurrency: 'BTC',
 *  quoteCurrency: 'USD',
 *  limitPrice: '400',
 *  raw: [Object] // raw data from input object
 *  createTime: '2014-02-11T17:05:15Z'
 * }
 *
 * @param order Object
 * @returns Object
 */
module.exports.parseOpenOrder = function (order) {
  var apiBaseCurrency = order.instrument.slice(0, 3);
  var baseCurrency = this.normalizeCurrency(apiBaseCurrency);
  var quoteCurrency = order.instrument.slice(3, 6);
  var entry = {};

  entry.externalId = order.id;
  entry.type = order.type;
  entry.state = 'open';

  var baseAmount = Currency.toSmallestSubUnit(order.amount, baseCurrency);

  // If sell order - baseAmount is negative
  if (order.side === 'sell') {
    baseAmount = -baseAmount;
  }

  entry.baseAmount = baseAmount;
  entry.baseCurrency = baseCurrency;
  entry.quoteCurrency = quoteCurrency;
  entry.limitPrice = parseFloat(order.price);

  entry.raw = order;

  return entry;
};

/**
 * Parses a closed order object in ItBit style to a object in the interface format
 *
 * Example of input:
 * {
 *  id: '248ffda4-83a0-4033-a5bb-8929d523f59f',
 *  walletId: '7e037345-1288-4c39-12fe-d0f99a475a98',
 *  side: 'buy',
 *  instrument: 'XBTUSD',
 *  type: 'limit',
 *  currency: 'XBT',
 *  amount: '0.0010',
 *  price: '400',
 *  amountFilled: '0',
 *  volumeWeightedAveragePrice: '0',
 *  createdTime: '2014-02-11T17:05:15Z',
 *  status: 'filled',
 *  metadata: {},
 *  clientOrderIdentifier: ''
 * }
 *
 *
 * Example of output object:
 * {
 *  id: '248ffda4-83a0-4033-a5bb-8929d523f59f',
 *  type: 'limit',
 *  state: 'closed',
 *  baseAmount: 100000,
 *  baseCurrency: 'BTC',
 *  quoteCurrency: 'USD',
 *  limitPrice: 400,
 *  raw: [Object],
 *  createTime: '2014-02-11T17:05:15Z',
 *  quoteAmount: 195533,
 *  feeAmount: 2,
 *  feeCurrency: 'USD'
 * }
 *
 * @param tradeObject
 * @param tradeResults
 * @returns {Object}
 */
module.exports.parseClosedOrder = function (order, tradeResults) {
  var tradeQuoteAmount = 0;
  var tradeFeeAmount = 0;
  var tradeFeeCurrency = '';

  /*
   * For each object in tradeResults - add the quoteAmount and feeAmount to the overall result
   */
  tradeResults.forEach(function (trade) {
    tradeQuoteAmount += parseFloat(trade.currency2Amount);
    tradeFeeAmount += parseFloat(trade.commissionPaid);
    tradeFeeCurrency = trade.commissionCurrency;
  });

  var result = this.parseOpenOrder(order);

  var quoteAmount = Currency.toSmallestSubUnit(tradeQuoteAmount, result.quoteCurrency);

  // If buy order - quoteAmount is negative
  if (order.side === 'buy') {
    quoteAmount = -quoteAmount;
  }

  result.state = 'closed';
  result.quoteAmount = quoteAmount;
  result.feeAmount = Currency.toSmallestSubUnit(tradeFeeAmount, tradeFeeCurrency);
  result.feeCurrency = tradeFeeCurrency;

  return result;
};

/**
 * Parses a closed order object in ItBit style to a object in the interface format
 *
 * Example of input:
 * {
 *  id: '7e037345-1288-4c39-12fe-d0f99a475a98',
 *  userId: '5591e419-a356-4fc0-b43c-3c84c2fd8013',
 *  name: 'My New Wallet',
 *  balances:
 *  [ { currency: 'USD',
 *      availableBalance: '50000.0000000',
 *      totalBalance: '50000.0000000' },
 *    { currency: 'XBT',
 *      availableBalance: '100.0000000',
 *      totalBalance: '100.0000000'
 *    }
 *  ]
 * }
 *
 * Example of output:
 * {
 *  available: {
 *    USD: 5000000,
 *    BTC: 10000000000
 *  },
 *  total: {
 *    USD: 5000000,
 *    BTC: 10000000000
 *  }
 * }
 *
 *
 * @param balances
 * @returns {Object}
 */
module.exports.parseBalance = function(balances) {
  var result = {};
  result.available = {};
  result.total = {};

  balances.balances.forEach(function (balance) {
    var currency = (balance.currency === 'XBT') ? 'BTC' : balance.currency;

    var available = Currency.toSmallestSubUnit(balance.availableBalance, currency);
    var totalBalance = Currency.toSmallestSubUnit(balance.totalBalance, currency);
    result.available[currency] = available;
    result.total[currency] = totalBalance;
  });

  return result;
};

/**
 * Computes a unique ID for a transaction from the fields of a transaction object.
 *
 * Transactions with type 'withdrawal' have a 'withdrawalId' field, which supposedly is unique.
 * Transactions with type 'deposit' and currency 'BTC' have a 'txnHash' field, which is the BTC tx hash (also unique)
 * Other 'deposit' type transactions do not have a unique field, so we'll use a combination of 'time' and 'currency'.
 *   We could also have used the 'amount' field, but chose not to, in case itBit decides to change the number
 *   of decimals on an amount in the future.
 *   Also, the 'time' field is with millisecond precision, so the assumption is that no two non-BTC deposits
 *   of the same currency will be recorded at the same millisecond.
 *
 * To have a kind of consistency, we will hash all the "unique fields" to generate the unique ID
 *
 * @param transaction
 * @return {string} Unique identifier for this transaction
 */
module.exports.getUniqueTransactionId = function(transaction) {
  /*
   * First, find a string that is unique for this transaction
   */
  var uniqueStringToHash;
  if ( transaction.transactionType === 'Withdrawal' && transaction.withdrawalId ) {
    /* Withdrawal, use withdrawalID field */
    uniqueStringToHash = transaction.withdrawalId.toString();
  } else if ( transaction.transactionType === 'Deposit' && transaction.txnHash ) {
    /* BTC deposit, use transaction hash */
    uniqueStringToHash = transaction.txnHash;
  } else if ( transaction.transactionType === 'Deposit' && transaction.time && transaction.currency ) {
    /* Non-BTC deposit, use combination of 'time', 'currency' */
    uniqueStringToHash = transaction.time + '-' + transaction.currency;
  } else {
    /* Unknown, don't know how to generate a unique string. Better throw an exception */
    throw new TypeError('Unknown unique identifier for transaction', transaction);
  }

  /*
   * Now hash the string and return the hexadecimal representation
   */
  var crypto = require('crypto');
  var sha256 = crypto.createHash('sha256');
  sha256.update(uniqueStringToHash);
  return sha256.digest('hex');
};

/**
 * Parses a transaction object in ItBit style to a object in the interface format
 *
 * Example of input:
 * {
 *  bankName: 'test',
 *  withdrawalId: 19,
 *  holdingPeriodCompletionDate: '2015-02-21T23:43:37.1230000',
 *  time: '2015-02-18T23:43:37.1230000',
 *  currency: 'EUR',
 *  transactionType: 'Withdrawal',
 *  amount: '100.00000000',
 *  walletName: 'Wallet',
 *  status: 'completed'
 * }
 *
 * Example of output:
 * {
 *  id: 19,
 *  externalId: '584870a10c92e83a8431e0e93a17c8470b2d5cdd3816f8eb9c70a68aaf7256e8',
 *  state: 'completed',
 *  amount: 10000,
 *  type: 'withdrawal',
 *  raw: [Object],
 *  createTime: '2015-02-18T23:43:37.1230000'
 * }
 *
 * @param transaction Object
 * @param log Logger to use in case of unrecognized transaction state
 * @returns Object
 */
module.exports.parseTransaction = function (transaction, log) {
  var entry = {};

  /* Tx state */
  switch (transaction.status) {
    case 'completed':
    case 'cancelled':
    case 'relayed':
      entry.state = transaction.status;
      break;
    default:
      if ( log ) {
        log.warn(transaction, 'ItBit transaction status not recognized, we assume transaction was completed...');
      }
      break;
  }

  /* Tx type */
  switch (transaction.transactionType) {
    case 'Withdrawal':
    case 'Deposit':
      entry.type = transaction.transactionType.toLowerCase();
      break;
    default:
      throw new TypeError('ItBit transaction type not recognized ("'+ transaction.transactionType +'")');
  }

  entry.externalId = module.exports.getUniqueTransactionId(transaction);
  entry.currency = module.exports.normalizeCurrency(transaction.currency);
  entry.amount = Currency.toSmallestSubUnit(transaction.amount, entry.currency);

  /*
   * Add timestamp.
   *
   * Add time zone (trailing 'Z') if necessary. itBit usually returns timestamps as e.g. "2015-03-21T17:37:39.9170000"
   */
  var timestamp = transaction.time.endsWith('Z') || transaction.time.endsWith('+0') ?
    transaction.time : transaction.time + 'Z';
  entry.timestamp = new Date(timestamp).toISOString();


  if (transaction.txnHash) {
    entry.chainTxId = transaction.txnHash;
  }

  /* If withdrawal, amount should be negative */
  if ( entry.type === 'withdrawal' ) {
    entry.amount = - entry.amount;
  }

  entry.raw = transaction;

  return entry;
};

/**
 * Parses a closed order object in ItBit style to a object in the interface format
 *
 * Example of input:
 * {
 *  bids:
 *  [ [ '420.24', '60.1103' ],
 *    [ '419.98', '23.739' ],
 *    [ '419.97', '15.92' ],
 *    [ '419.95', '0.251' ] ]
 * asks:
 *  [ [ '420.32', '25' ],
 *    [ '420.43', '7' ],
 *    [ '420.96', '58.7777' ],
 *    [ '421.16', '1.544' ] ]
 * }
 *
 * Example of output:
 * {
 * asks:
 *  [ { price: 420.38, baseAmount: 2500000000 },
 *    { price: 420.43, baseAmount: 700000000 },
 *    { price: 420.59, baseAmount: 5958810000 },
 *    { price: 420.9, baseAmount: 149800000 } ],
 * bids:
 *  [ { price: 420.24, baseAmount: 6011030000 },
 *    { price: 420, baseAmount: 2371600000 },
 *    { price: 419.98, baseAmount: 1592000000 },
 *    { price: 419.97, baseAmount: 13000000 } ],
 * baseCurrency: 'BTC',
 * quoteCurrency: 'USD'
 * }
 *
 *
 * @param orderBook
 * @param baseCurrency
 * @param quoteCurrency
 * @returns {{}}
 */
module.exports.parseOrderBook = function (orderBook, baseCurrency, quoteCurrency) {
  var result = {};

  result.asks = [];
  result.bids = [];
  result.baseCurrency = baseCurrency;
  result.quoteCurrency = quoteCurrency;

  var asksList = orderBook.asks || [];
  var bidsList = orderBook.bids || [];

  var convertOrderBookEntry = convertOrderBookEntryCreator(baseCurrency);

  result.asks = asksList.map(convertOrderBookEntry);
  result.bids = bidsList.map(convertOrderBookEntry);

  return result;
};

/**
 * Returns a function that adds 'price' and 'baseAmount' keys to array
 * and formats the currency to smallest subunit.
 *
 * @param currency
 * @returns {Function}
 */
var convertOrderBookEntryCreator = function convertOrderBookCreator(currency) {
  return function(entry) {
    return {
      price: parseFloat(entry[0]),
      baseAmount: Currency.toSmallestSubUnit(parseFloat(entry[1]), currency)
    }
  };
};

/**
 * Normalizes if the currency has a different name on the exchange.
 *
 * @param {string} currency
 * @returns {string} currency
 */
module.exports.normalizeCurrency = function(currency) {
  if (currency === 'XBT') {
    return 'BTC'
  }

  return currency;
};

/**
 * Normalizes currency to ItBit format. ('BTC' is 'XBT')
 *
 * @param {string} currency
 * @returns {string} currency
 */
module.exports.normalizeCurrencyItBit = function(currency) {
  if (currency === 'BTC') {
    return 'XBT'
  }

  return currency;
};

