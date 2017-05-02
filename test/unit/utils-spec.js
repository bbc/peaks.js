'use strict';

var utils = require('../../src/main/waveform/waveform.utils.js');

describe('niceTime', function() {
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
          expect(utils.niceTime(test.input, false)).to.equal(test.output);
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
          expect(utils.niceTime(test.input, true)).to.equal(test.output);
        });
      });
    });
  });
});
