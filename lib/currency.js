/**
 * Returns the number of decimals after the floating point, with which
 * the amount should be formatted, depending on the CurrencyHelper.
 *
 * @param currency string
 * @returns int
 */
function getDecimalsForCurrency(currency) {
  if (currency == 'BTC') {
    return 8;
  } else {
    return 2;
  }
}

/**
 * Convert an amount of money to the smallest sub-unit of the CurrencyHelper.
 * For example, for a BTC account, this function will convert
 * 12345678 to 0.12345678.
 * Likewise, for a USD account, 12345 is converted to 123.45.
 * This function is the inverse of {@self::toSmallestSubUnit}
 *
 * @param amount int
 * @param currency string
 *
 * @return float
 */
module.exports.fromSmallestSubUnit = function (amount, currency) {
  var decimals = getDecimalsForCurrency(currency);
  var number = amount / Math.pow(10, decimals);
  return number.toFixed(decimals);
};


/**
 * Convert an amount of smallest sub-unit to the actual CurrencyHelper unit.
 * For example, for a BTC account, this function will convert
 * 0.12345678 to 12345678.
 * Likewise, for a USD account, 123.45 is converted to 12345.
 * This function is the inverse of {@self::fromSmallestSubUnit}
 *
 * @param amount int
 * @param currency string
 *
 * @return int
 */
module.exports.toSmallestSubUnit = function (amount, currency) {
  var decimals = getDecimalsForCurrency(currency);
  return Math.round(amount * Math.pow(10, decimals));
};


/**
 * Returns a formatted amount depending on CurrencyHelper
 * Formats the subunit amount and converts to real amount
 *
 * @param amount int
 * @param currency string
 * @param machine_readable bool False will format for human reading, true for machine reading
 *
 * @return string Amount in real unit and right format
 */
module.exports.formatAmount = function (amount, currency, machine_readable) {
  var number = fromSmallestSubUnit(amount, currency);
  var decimals = getDecimalsForCurrency(currency);
  if (machine_readable) {
    return number.toFixed(decimals);
  } else {
    return number_format(number, decimals, '.', ',');
  }
};

