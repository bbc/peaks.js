'use strict';

var Utils = require('../../src/main/waveform/waveform.utils');

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
            expect(Utils.formatTime(test.input, false)).to.equal(test.output);
          });
        });
      });
    });

    context('without hundredths', function() {
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
            expect(Utils.formatTime(test.input, true)).to.equal(test.output);
          });
        });
      });
    });
  });

  describe('clamp', function() {
    it('should given value if in range', function() {
      expect(Utils.clamp(15, 10, 20)).to.equal(15);
      expect(Utils.clamp(-15, -20, -10)).to.equal(-15);
    });

    it('should return minimum if given value is lower', function() {
      expect(Utils.clamp(1, 10, 20)).to.equal(10);
      expect(Utils.clamp(-21, -20, -10)).to.equal(-20);
    });

    it('should return maximum if given value is higher', function() {
      expect(Utils.clamp(21, 10, 20)).to.equal(20);
      expect(Utils.clamp(-9, -20, -10)).to.equal(-10);
    });
  });

  describe('isValidTime', function() {
    it('should accept valid numbers', function() {
      expect(Utils.isValidTime(1.0)).to.equal(true);
      expect(Utils.isValidTime(-1.0)).to.equal(true);
    });

    it('should reject strings', function() {
      expect(Utils.isValidTime('1.0')).to.equal(false);
      expect(Utils.isValidTime('test')).to.equal(false);
    });

    it('should reject invalid numbers', function() {
      expect(Utils.isValidTime(Infinity)).to.equal(false);
      expect(Utils.isValidTime(-Infinity)).to.equal(false);
      expect(Utils.isValidTime(NaN)).to.equal(false);
    });

    it('should reject other non-numeric values', function() {
      expect(Utils.isValidTime(null)).to.equal(false);
      expect(Utils.isValidTime(undefined)).to.equal(false);
      expect(Utils.isValidTime({})).to.equal(false);
      expect(Utils.isValidTime([])).to.equal(false);
      expect(Utils.isValidTime(function foo() {})).to.equal(false);
    });
  });

  describe('isObject', function() {
    it('should accept objects', function() {
      expect(Utils.isObject({})).to.equal(true);
    });

    it('should reject functions', function() {
      expect(Utils.isObject(function foo() {})).to.equal(false);
    });

    it('should reject arrays', function() {
      expect(Utils.isObject([])).to.equal(false);
    });

    it('should reject other non-object values', function() {
      expect(Utils.isObject(null)).to.equal(false);
      expect(Utils.isObject(undefined)).to.equal(false);
      expect(Utils.isObject('test')).to.equal(false);
      expect(Utils.isObject(1.0)).to.equal(false);
    });
  });

  describe('isString', function() {
    it('should accept strings', function() {
      expect(Utils.isString('')).to.equal(true);
      expect(Utils.isString('test')).to.equal(true);
    });

    it('should reject numbers', function() {
      expect(Utils.isString(1.0)).to.equal(false);
      expect(Utils.isString(-1.0)).to.equal(false);
    });

    it('should reject non-string values', function() {
      expect(Utils.isString(null)).to.equal(false);
      expect(Utils.isString(undefined)).to.equal(false);
      expect(Utils.isString({})).to.equal(false);
      expect(Utils.isString([])).to.equal(false);
      expect(Utils.isString(function foo() {})).to.equal(false);
    });
  });

  describe('isNullOrUndefined', function() {
    it('should accept null or undefined', function() {
      expect(Utils.isNullOrUndefined(null)).to.equal(true);
      expect(Utils.isNullOrUndefined(undefined)).to.equal(true);
    });

    it('should reject other values', function() {
      expect(Utils.isNullOrUndefined('')).to.equal(false);
      expect(Utils.isNullOrUndefined(0)).to.equal(false);
      expect(Utils.isNullOrUndefined({})).to.equal(false);
      expect(Utils.isNullOrUndefined([])).to.equal(false);
      expect(Utils.isNullOrUndefined(function foo() {})).to.equal(false);
    });
  });

  describe('isFunction', function() {
    it('should accept functions', function() {
      expect(Utils.isFunction(function foo() {})).to.equal(true);
    });

    it('should reject other values', function() {
      expect(Utils.isFunction(null)).to.equal(false);
      expect(Utils.isFunction(undefined)).to.equal(false);
      expect(Utils.isFunction('')).to.equal(false);
      expect(Utils.isFunction(0)).to.equal(false);
      expect(Utils.isFunction({})).to.equal(false);
      expect(Utils.isFunction([])).to.equal(false);
    });
  });
});
