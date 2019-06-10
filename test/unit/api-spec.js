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

      it('should invoke callback when initialised', function(done) {
        Peaks.init({
          container: document.getElementById('container'),
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: 'base/test_data/sample.dat' }
        },
        function(err, instance) {
          expect(err).to.equal(null);
          expect(instance).to.be.an.instanceOf(Peaks);
          instance.destroy();
          done();
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

        afterEach(function() {
          document.body.removeChild(overviewContainer);
          document.body.removeChild(zoomviewContainer);
        });

        it('should construct a Peaks object with overview and zoomable waveforms', function(done) {
          p = Peaks.init({
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
          p = Peaks.init({
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
          p = Peaks.init({
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
            p = Peaks.init({
              containers: {
              },
              mediaElement: document.getElementById('media'),
              dataUri: { arraybuffer: 'base/test_data/sample.dat' }
            });
          }).to.throw(/must be valid HTML elements/);
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

  describe('destroy', function() {
    it('should clean up event listeners', function(done) {
      var errorSpy = sinon.spy().named('window.onerror');
      var oldOnError = window.onerror;
      window.onerror = errorSpy;

      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        audioContext: new TestAudioContext()
      });

      p.on('peaks.ready', function() {
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
});
