import {
  clamp, formatTime, isInAscendingOrder, isFunction, isLinearGradientColor,
  isNullOrUndefined, isObject, isString, isValidTime, roundUpToNearest
} from '../../src/utils';

describe('Utils', function() {
  describe('formatTime', function() {
    context('with hundredths', function() {
      var tests = [
        { input: 0,            output:    '00:00.00' },
        { input: 1,            output:    '00:01.00' },
        { input: 60,           output:    '01:00.00' },
        { input: 60 * 60,      output: '01:00:00.00' },
        { input: 24 * 60 * 60, output: '24:00:00.00' },
        { input: 10.5,         output:    '00:10.50' }
      ];

      tests.forEach(function(test) {
        context('given ' + test.input, function() {
          it('should output ' + test.output, function() {
            expect(formatTime(test.input, 2)).to.equal(test.output);
          });
        });
      });
    });

    context('with thousandths', function() {
      var tests = [
        { input: 0,            output:    '00:00.000' },
        { input: 1,            output:    '00:01.000' },
        { input: 60,           output:    '01:00.000' },
        { input: 60 * 60,      output: '01:00:00.000' },
        { input: 24 * 60 * 60, output: '24:00:00.000' },
        { input: 10.5,         output:    '00:10.500' },
        { input: 20.003,       output:    '00:20.003' },
        { input: 25.07,        output:    '00:25.070' }
      ];

      tests.forEach(function(test) {
        context('given ' + test.input, function() {
          it('should output ' + test.output, function() {
            expect(formatTime(test.input, 3)).to.equal(test.output);
          });
        });
      });
    });

    context('without fraction seconds', function() {
      var tests = [
        { input: 0,            output:    '00:00' },
        { input: 1,            output:    '00:01' },
        { input: 60,           output:    '01:00' },
        { input: 60 * 60,      output: '01:00:00' },
        { input: 24 * 60 * 60, output: '24:00:00' },
        { input: 10.5,         output:    '00:10' }
      ];

      tests.forEach(function(test) {
        context('given ' + test.input, function() {
          it('should output ' + test.output, function() {
            expect(formatTime(test.input, 0)).to.equal(test.output);
          });
        });
      });
    });
  });

  describe('roundUpToNearest', function() {
    it('should return an integer', function() {
      expect(roundUpToNearest(0.1523809523809524, 1)).to.equal(1);
    });

    it('should round upwards', function() {
      expect(roundUpToNearest(5.5, 3)).to.equal(6);
      expect(roundUpToNearest(38.9, 5)).to.equal(40);
      expect(roundUpToNearest(141.0, 10)).to.equal(150);
    });

    it('should round negative values towards negative infinity', function() {
      expect(roundUpToNearest(-5.5, 3)).to.equal(-6);
    });

    it('should return 0 given a multiple of 0', function() {
      expect(roundUpToNearest(5.5, 0)).to.equal(0);
    });
  });

  describe('clamp', function() {
    it('should given value if in range', function() {
      expect(clamp(15, 10, 20)).to.equal(15);
      expect(clamp(-15, -20, -10)).to.equal(-15);
    });

    it('should return minimum if given value is lower', function() {
      expect(clamp(1, 10, 20)).to.equal(10);
      expect(clamp(-21, -20, -10)).to.equal(-20);
    });

    it('should return maximum if given value is higher', function() {
      expect(clamp(21, 10, 20)).to.equal(20);
      expect(clamp(-9, -20, -10)).to.equal(-10);
    });
  });

  describe('isInAscendingOrder', function() {
    it('should accept an empty array', function() {
      expect(isInAscendingOrder([])).to.equal(true);
    });

    it('should accept a sorted array', function() {
      expect(isInAscendingOrder([1, 2, 3, 4])).to.equal(true);
    });

    it('should reject an array with duplicate values', function() {
      expect(isInAscendingOrder([1, 1, 2, 3])).to.equal(false);
    });

    it('should reject an array in the wrong order', function() {
      expect(isInAscendingOrder([4, 3, 2, 1])).to.equal(false);
    });
  });

  describe('isValidTime', function() {
    it('should accept valid numbers', function() {
      expect(isValidTime(1.0)).to.equal(true);
      expect(isValidTime(-1.0)).to.equal(true);
    });

    it('should reject strings', function() {
      expect(isValidTime('1.0')).to.equal(false);
      expect(isValidTime('test')).to.equal(false);
    });

    it('should reject invalid numbers', function() {
      expect(isValidTime(Infinity)).to.equal(false);
      expect(isValidTime(-Infinity)).to.equal(false);
      expect(isValidTime(NaN)).to.equal(false);
    });

    it('should reject other non-numeric values', function() {
      expect(isValidTime(null)).to.equal(false);
      expect(isValidTime(undefined)).to.equal(false);
      expect(isValidTime({})).to.equal(false);
      expect(isValidTime([])).to.equal(false);
      expect(isValidTime(function foo() {})).to.equal(false);
    });
  });

  describe('isObject', function() {
    it('should accept objects', function() {
      expect(isObject({})).to.equal(true);
    });

    it('should reject functions', function() {
      expect(isObject(function foo() {})).to.equal(false);
    });

    it('should reject arrays', function() {
      expect(isObject([])).to.equal(false);
    });

    it('should reject other non-object values', function() {
      expect(isObject(null)).to.equal(false);
      expect(isObject(undefined)).to.equal(false);
      expect(isObject('test')).to.equal(false);
      expect(isObject(1.0)).to.equal(false);
    });
  });

  describe('isString', function() {
    it('should accept strings', function() {
      expect(isString('')).to.equal(true);
      expect(isString('test')).to.equal(true);
    });

    it('should reject numbers', function() {
      expect(isString(1.0)).to.equal(false);
      expect(isString(-1.0)).to.equal(false);
    });

    it('should reject non-string values', function() {
      expect(isString(null)).to.equal(false);
      expect(isString(undefined)).to.equal(false);
      expect(isString({})).to.equal(false);
      expect(isString([])).to.equal(false);
      expect(isString(function foo() {})).to.equal(false);
    });
  });

  describe('isNullOrUndefined', function() {
    it('should accept null or undefined', function() {
      expect(isNullOrUndefined(null)).to.equal(true);
      expect(isNullOrUndefined(undefined)).to.equal(true);
    });

    it('should reject other values', function() {
      expect(isNullOrUndefined('')).to.equal(false);
      expect(isNullOrUndefined(0)).to.equal(false);
      expect(isNullOrUndefined({})).to.equal(false);
      expect(isNullOrUndefined([])).to.equal(false);
      expect(isNullOrUndefined(function foo() {})).to.equal(false);
    });
  });

  describe('isFunction', function() {
    it('should accept functions', function() {
      expect(isFunction(function foo() {})).to.equal(true);
    });

    it('should reject other values', function() {
      expect(isFunction(null)).to.equal(false);
      expect(isFunction(undefined)).to.equal(false);
      expect(isFunction('')).to.equal(false);
      expect(isFunction(0)).to.equal(false);
      expect(isFunction({})).to.equal(false);
      expect(isFunction([])).to.equal(false);
    });
  });

  describe('isLinearGradientColor', function() {
    it ('should accept valid linear gradient object', function() {
      expect(isLinearGradientColor({
        linearGradientStart: 0,
        linearGradientEnd: 100,
        linearGradientColorStops: ['red', 'blue']
      })).to.equal(true);
    });

    it ('should reject invalid gradient values', function() {
      expect(isLinearGradientColor({
        linearGradientStart: 0,
        linearGradientEnd: 100,
        linearGradientColorStops: ['red']
      })).to.equal(false);

      expect(isLinearGradientColor({
        linearGradientStart: '0',
        linearGradientEnd: '100',
        linearGradientColorStops: ['red']
      })).to.equal(false);

      expect(isLinearGradientColor({
        linearGradientStart: 0,
        linearGradientColorStops: ['red', 'blue']
      })).to.equal(false);

      expect(isLinearGradientColor({
        linearGradientEnd: 100,
        linearGradientColorStops: ['red', 'blue']
      })).to.equal(false);
    });

    it ('should reject other values', function() {
      expect(isLinearGradientColor('red')).to.equal(false);
      expect(isLinearGradientColor('#fff')).to.equal(false);
      expect(isLinearGradientColor(123)).to.equal(false);
      expect(isLinearGradientColor(['red', 'blue'])).to.equal(false);
    });
  });
});
