/* eslint-disable max-len */

(function(Peaks) {
  var TestAudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;

  describe('Peaks API interface', function() {
    var sandbox;
    var peaksInstance = null;

    /**
    * SETUP =========================================================
    */

    beforeEach(function beforeEach(done) {
      sandbox = sinon.sandbox.create();
      peaksInstance = null;
      setTimeout(done, 100);
    });

    /**
    * TEARDOWN ======================================================
    */

    afterEach(function() {
      if (peaksInstance) {
        peaksInstance.destroy();
        peaksInstance = null;
      }
      sandbox.restore();
    });

    /**
    * TESTS =========================================================
    */

    describe('create', function() {
      it('should throw an exception if no mediaElement is provided', function() {
        expect(function() {
          new Peaks({
            container: document.getElementById('waveform-visualiser-container'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/provide an audio element/);
      });

      it('should throw an exception if mediaElement is not an HTMLMediaElement', function() {
        expect(function() {
          new Peaks({
            container: document.getElementById('waveform-visualiser-container'),
            mediaElement: document.createElement('div'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/HTMLMediaElement/);
      });

      it('should thrown an exception if no container is provided', function() {
        expect(function() {
          new Peaks({
            mediaElement: document.querySelector('audio'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/provide a container/);
      });

      it('should thrown an exception if the container has no layout', function() {
        expect(function() {
          new Peaks({
            container: document.createElement('div'),
            mediaElement: document.querySelector('audio'),
            dataUri: { arraybuffer: 'base/test_data/sample.dat' }
          });
        }).to.throw(/width/);
      });

      it('should thrown an exception if the logger is defined and not a function', function() {
        expect(function() {
          new Peaks({
            container: document.getElementById('waveform-visualiser-container'),
            mediaElement: document.querySelector('audio'),
            dataUri: 'base/test_data/sample.json',
            logger: 'foo'
          });
        }).to.throw(/logger/);
      });

      it('should send a deprecation notice if Peaks.init form is used', function() {
        var spy = sandbox.spy();

        peaksInstance = Peaks.init({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/sample.json',
          deprecationLogger: spy
        });

        expect(spy).to.have.been.calledOnce;
        expect(spy).to.have.been.calledWithMatch('`Peaks.init(options)` form is deprecated.');
      });

      it('should return a Peaks instance if called as a function', function() {
        // eslint-disable-next-line new-cap
        peaksInstance = Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/sample.json'
        });

        expect(peaksInstance).to.be.an.instanceOf(Peaks);
      });

      it('should broadcast errors to a configurable logger', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/sample.json',
          logger: sandbox.spy()
        });

        peaksInstance.emit('error', new Error('Expected to be logged.'));

        setTimeout(function() {
          expect(peaksInstance.logger).to.have.been.calledOnce;
          done();
        }, 0);
      });

      it('should return a new Peaks instance', function() {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/sample.json'
        });

        expect(peaksInstance).to.be.an.instanceof(Peaks);
      });
    });

    describe('destroy', function() {
      var container;

      beforeEach(function() {
        var regularContainer = document.getElementById('waveform-visualiser-container');
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '100px';
        regularContainer.parentNode.appendChild(container);
      });

      afterEach(function() {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });

      it('should clean up event listeners', function(done) {
        var errorSpy = sinon.spy().named('window.onerror');
        var resizeSpy = sinon.spy().named('window_resized');
        var oldOnError = window.onerror;
        window.onerror = errorSpy;

        peaksInstance = new Peaks({
          container: container,
          mediaElement: document.querySelector('audio'),
          audioContext: new TestAudioContext()
        });

        peaksInstance.on('window_resized', resizeSpy);

        peaksInstance.on('waveform_ready.overview', function() {
          container.parentNode.removeChild(container);

          // Give peaks chance to bind its resize listener:
          setTimeout(function() {
            peaksInstance.destroy();
            peaksInstance = null;

            // Fire a resize event, which would normally cause peaks to redraw
            var e = document.createEvent('HTMLEvents');
            e.initEvent('resize', true, false);
            window.dispatchEvent(e);

            // Our resize handler is asynchronously throttled, so give it a
            // little time to settle.
            setTimeout(function() {
              window.onerror = oldOnError;
              expect(resizeSpy).to.not.have.been.called;
              expect(errorSpy).to.not.have.been.called;
              done();
            }, 600);
          }, 1);
        });
      });
    });

    describe('core#getRemoteData', function() {
      it('should use the dataUriDefaultFormat value as a format URL if dataUri is provided as string', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/sample.json'
        });

        var spy = sandbox.spy(peaksInstance.waveform, 'handleRemoteData');

        peaksInstance.on('segments.ready', function() {
          var xhr = spy.getCall(0).args[1];

          expect(xhr.getResponseHeader('content-type')).to.equal('application/json');

          done();
        });
      });

      it('should emit an error if the data handling fails', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'base/test_data/404-file.json'
        });

        peaksInstance.on('error', function(err) {
          done();
        });
      });

      it.skip('should emit an error if the data handling fails due to a network error', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: 'file:///test.json'
        });

        peaksInstance.on('error', function(err) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.equal('XHR Failed');
          done();
        });
      });

      it('should use the JSON dataUri connector', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        });

        var spy = sandbox.spy(peaksInstance.waveform, 'handleRemoteData');

        peaksInstance.on('segments.ready', function() {
          var xhr = spy.getCall(0).args[1];

          expect(xhr.getResponseHeader('content-type')).to.equal('application/json');

          done();
        });
      });

      ('ArrayBuffer' in window) && it('should use the arraybuffer dataUri connector or fail if not available', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        });

        var spy = sandbox.spy(peaksInstance.waveform, 'handleRemoteData');

        peaksInstance.on('segments.ready', function() {
          var xhr = spy.getCall(0).args[1];

          expect(xhr.getResponseHeader('content-type')).to.equal('text/plain');

          done();
        });
      });

      !('ArrayBuffer' in window) && it('should throw an exception if the only available format is browser incompatible', function() {
        expect(function() {
          new Peaks({
            container: document.getElementById('waveform-visualiser-container'),
            mediaElement: document.querySelector('audio'),
            dataUri: {
              arraybuffer: 'base/test_data/sample.dat'
            }
          });
        }).to.throw();
      });

      it('should pick the arraybuffer format over the JSON one', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat',
            json: 'base/test_data/sample.json'
          }
        });

        var spy = sandbox.spy(peaksInstance.waveform, 'handleRemoteData');
        var expectedContentType = window.ArrayBuffer ? 'text/plain' : 'application/json';

        peaksInstance.on('segments.ready', function() {
          var xhr = spy.getCall(0).args[1];

          expect(xhr.getResponseHeader('content-type')).to.equal(expectedContentType);

          done();
        });
      });

      ('AudioBuffer' in window) && it('should build using WebAudio if the API is available and no dataUri is provided', function(done) {
        peaksInstance = new Peaks({
          container: document.getElementById('waveform-visualiser-container'),
          mediaElement: document.querySelector('audio'),
          audioContext: new TestAudioContext()
        });

        var spy = sandbox.spy(peaksInstance.waveform, 'handleRemoteData');

        peaksInstance.on('segments.ready', function() {
          expect(spy).to.have.been.calledOnce;

          done();
        });
      });
    });
  });
})(peaks);
