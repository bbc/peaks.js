'use strict';

require('./setup');

var Peaks = require('../../src/main');
var WaveformOverview = require('../../src/main/views/waveform.overview');
var WaveformZoomView = require('../../src/main/views/waveform.zoomview');

describe('Peaks.views', function() {
  var p;

  var overviewContainer = null;
  var zoomviewContainer = null;

  beforeEach(function() {
    overviewContainer = document.createElement('div');
    overviewContainer.style.width = '400px';
    overviewContainer.style.height = '100px';
    document.body.appendChild(overviewContainer);

    zoomviewContainer = document.createElement('div');
    zoomviewContainer.style.width = '400px';
    zoomviewContainer.style.height = '100px';
    document.body.appendChild(zoomviewContainer);
  });

  afterEach(function() {
    document.body.removeChild(overviewContainer);
    document.body.removeChild(zoomviewContainer);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
    }
  });

  describe('getView', function() {
    context('with zoomview and overview containers', function() {
      beforeEach(function(done) {
        p = Peaks.init({
          containers: {
            zoomview: zoomviewContainer,
            overview: overviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        });

        p.on('peaks.ready', done);
      });

      it('should return the zoomview', function() {
        var view = p.views.getView('zoomview');
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return the overview', function() {
        var view = p.views.getView('overview');
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return null if given no view name', function() {
        var view = p.views.getView();
        expect(view).to.equal(null);
      });

      it('should return null if given an invalid view name', function() {
        var view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });

    context('with only a zoomview container', function() {
      beforeEach(function(done) {
        p = Peaks.init({
          containers: {
            zoomview: zoomviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        });

        p.on('peaks.ready', done);
      });

      it('should return the zoomview', function() {
        var view = p.views.getView('zoomview');
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return null if given the overview view name', function() {
        var view = p.views.getView('overview');
        expect(view).to.equal(null);
      });

      it('should return the zoomview if given no view name', function() {
        var view = p.views.getView();
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return null if given an invalid view name', function() {
        var view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });

    context('with only an overview container', function() {
      beforeEach(function(done) {
        p = Peaks.init({
          containers: {
            overview: overviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        });

        p.on('peaks.ready', done);
      });

      it('should return null if given the zoomview view name', function() {
        var view = p.views.getView('zoomview');
        expect(view).to.equal(null);
      });

      it('should return the overview', function() {
        var view = p.views.getView('overview');
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return the overview if given no view name', function() {
        var view = p.views.getView();
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return null if given an invalid view name', function() {
        var view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });
  });
});
