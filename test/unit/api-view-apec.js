'use strict';

require('./setup');

var Peaks = require('../../src/main');

describe('WaveformView', function() {
  var p;

  beforeEach(function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json'
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);
      p = instance;
      done();
    });
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  describe('setAmplitudeScale', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should set the amplitude scale to default', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale(1.2);
          }).to.not.throw();

          expect(view.getAmplitudeScale()).to.equal(1.2);
        });

        it('should throw if no scale is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale();
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid scale is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale('test');
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid number is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale(Infinity);
          }).to.throw(/Scale must be a valid number/);
        });
      });
    });
  });
});
