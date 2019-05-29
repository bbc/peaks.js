'use strict';

var Peaks = require('../../src/main');

var TestAudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;

describe('Peaks', function() {
  var p = null;

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  describe('init', function() {
    context('with valid options', function() {
      it('should emit peaks.ready and segments.ready events when initialised', function(done) {
        p = Peaks.init({
          container: document.getElementById('container'),
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        });

        var segmentsReady = false;
        var peaksReady = false;

        function readyHandler() {
          if (peaksReady && segmentsReady) {
            done();
          }
        }

        p.on('peaks.ready', function() {
          peaksReady = true;
          readyHandler();
        });

        // TODO: The segments.ready event is deprecated.
        p.on('segments.ready', function() {
          segmentsReady = true;
          readyHandler();
        });
      });
    });

    context('with invalid options', function() {
      it('should throw an exception if no mediaElement is provided', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/Missing mediaElement option/);
      });

      it('should throw an exception if mediaElement is not an HTMLMediaElement', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.createElement('div'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/HTMLMediaElement/);
      });

      it('should throw an exception if both a dataUri and audioContext are provided', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' },
            audioContext: new TestAudioContext()
          });
        }).to.throw(/not both/);
      });

      it('should throw an exception if neither a dataUri nor an audioContext are provided', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media')
          });
        }).to.throw(/audioContext or dataUri/);
      });

      it('should throw an exception if the dataUri is not an object', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: true
          });
        }).to.throw(/dataUri/);
      });

      it('should throw an exception if no container is provided', function() {
        expect(function() {
          Peaks.init({
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/container or containers option/);
      });

      it('should throw an exception if the container has no layout', function() {
        expect(function() {
          Peaks.init({
            container: document.createElement('div'),
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/width/);
      });

      it('should throw an exception if the template is not a string or an HTMLElement', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' },
            template: null
          });
        }).to.throw(/template/);
      });

      it('should throw an exception if the logger is defined and not a function', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: 'base/test_data/sample.json',
            logger: 'foo'
          });
        }).to.throw(/logger/);
      });

      it('should report errors to a configurable logger', function(done) {
        var logger = sinon.spy();

        p = Peaks.init({
          container: document.getElementById('container'),
          mediaElement: document.getElementById('media'),
          dataUri: 'base/test_data/sample.json',
          logger: logger
        });

        p.emit('error', new Error('Expected to be logged.'));

        setTimeout(function() {
          expect(p.logger).to.have.been.calledOnce;
          done();
        }, 0);
      });

      it('should throw an exception if the zoomLevels option is missing', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: 'base/test_data/sample.json',
            zoomLevels: null
          });
        }).to.throw(/zoomLevels/);
      });

      it('should throw an exception if the zoomLevels option is empty', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: 'base/test_data/sample.json',
            zoomLevels: []
          });
        }).to.throw(/zoomLevels/);
      });

      it('should throw an exception if the zoomLevels option is not in ascending order', function() {
        expect(function() {
          Peaks.init({
            container: document.getElementById('container'),
            mediaElement: document.getElementById('media'),
            dataUri: 'base/test_data/sample.json',
            zoomLevels: [1024, 512]
          });
        }).to.throw(/zoomLevels/);
      });
    });
  });

  describe('constructor', function() {
    context('with valid options', function() {
      it('should construct a Peaks object', function(done) {
        p = new Peaks({
          container: document.getElementById('container'),
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        });

        expect(p).to.be.an.instanceof(Peaks);

        p.on('peaks.ready', function() {
          done();
        });
      });
    });

    context('with containers option', function() {
      var overviewContainer;
      var zoomviewContainer;

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

      it('should construct a Peaks object with overview and zoomable waveforms', function(done) {
        p = new Peaks({
          containers: {
            overview: overviewContainer,
            zoomview: zoomviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        });

        expect(p).to.be.an.instanceof(Peaks);

        p.on('peaks.ready', function() {
          done();
        });
      });

      it('should construct a Peaks object with an overview waveform only', function(done) {
        p = new Peaks({
          containers: {
            overview: overviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        });

        expect(p).to.be.an.instanceof(Peaks);

        p.on('peaks.ready', function() {
          done();
        });
      });

      it('should construct a Peaks object with a zoomable waveform only', function(done) {
        p = new Peaks({
          containers: {
            zoomview: zoomviewContainer
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        });

        expect(p).to.be.an.instanceof(Peaks);

        p.on('peaks.ready', function() {
          done();
        });
      });

      it('should throw an error if no containers are given', function() {
        expect(function() {
          p = new Peaks({
              containers: {
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/must be valid HTML elements/);
      });
    });
  });

  describe('destroy', function() {
    var container;

    it('should clean up event listeners', function(done) {
      var errorSpy = sinon.spy().named('window.onerror');
      var resizeSpy = sinon.spy().named('window_resized');
      var oldOnError = window.onerror;
      window.onerror = errorSpy;

      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        audioContext: new TestAudioContext()
      });

      p.on('window_resized', resizeSpy);

      p.on('waveform_ready.overview', function() {
        // Give peaks chance to bind its resize listener:
        setTimeout(function() {
          p.destroy();

          // Fire a resize event, which would normally cause peaks to redraw
          var e = document.createEvent('HTMLEvents');
          e.initEvent('resize', true, false);
          window.dispatchEvent(e);

          // Our resize handler is asynchronously throttled, so give it a little time to settle.
          setTimeout(function() {
            window.onerror = oldOnError;
            expect(resizeSpy).to.not.have.been.called;
            expect(errorSpy).to.not.have.been.called;
            done();
          }, 600);
        }, 1);
      });
    });

    it('should be safe to call more than once', function(done) {
      var p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: 'base/test_data/sample.dat' }
      });

      p.on('peaks.ready', function() {
        p.destroy();
        p.destroy();
        done();
      });
    });
  });

  describe('core#getRemoteData', function() {
    it('should use the dataUriDefaultFormat value as a format URL if dataUri is provided as string', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: 'base/test_data/sample.json'
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.getResponseHeader('content-type')).to.equal('application/json');

        done();
      });
    });

    it('should emit an error if the data handling fails', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: 'base/test_data/404-file.json'
      });

      p.on('error', function(err) {
        done();
      });
    });

    it('should emit an error if the data handling fails due to a network error', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: 'file:///test.json'
      });

      p.on('error', function(err) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal('XHR Failed');
        done();
      });
    });

    it('should use the JSON dataUri connector', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: {
          json: 'base/test_data/sample.json'
        }
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.getResponseHeader('content-type')).to.equal('application/json');

        done();
      });
    });

    it('should not use credentials if withCredentials is not set', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: {
          json: 'base/test_data/sample.json'
        }
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.withCredentials).to.equal(false);

        done();
      });
    });

    it('should use credentials if withCredentials is set', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        withCredentials: true,
        dataUri: {
          json: 'base/test_data/sample.json'
        }
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.withCredentials).to.equal(true);

        done();
      });
    });

    ('ArrayBuffer' in window) && it('should use the arraybuffer dataUri connector or fail if not available', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: {
          arraybuffer: 'base/test_data/sample.dat'
        }
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.getResponseHeader('content-type')).to.equal('application/octet-stream');

        done();
      });
    });

    !('ArrayBuffer' in window) && it('should throw an exception if the only available format is browser incompatible', function() {
      expect(function() {
        Peaks.init({
          container: document.getElementById('container'),
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        });
      }).to.throw();
    });

    it('should pick the arraybuffer format over the JSON one', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: {
          arraybuffer: 'base/test_data/sample.dat',
          json: 'base/test_data/sample.json'
        }
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');
      var expectedContentType = window.ArrayBuffer ? 'application/octet-stream' : 'application/json';

      p.on('peaks.ready', function() {
        var xhr = spy.getCall(0).args[1];

        expect(xhr.getResponseHeader('content-type')).to.equal(expectedContentType);

        done();
      });
    });

    ('AudioBuffer' in window) && it('should build using WebAudio if the API is available and no dataUri is provided', function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        audioContext: new TestAudioContext()
      });

      var spy = sinon.spy(p.waveform, '_handleRemoteData');

      p.on('peaks.ready', function() {
        expect(spy).to.have.been.calledOnce;

        done();
      });
    });
  });
});
