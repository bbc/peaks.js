import WaveformBuilder from '../../src/waveform-builder';
import WaveformData from 'waveform-data';
import sampleJsonData from '../../test_data/sample.json';

var TestAudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;

describe('WaveformBuilder', function() {
  describe('init', function() {
    it('should use the dataUriDefaultFormat value as a format URL if dataUri is provided as string', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: 'base/test_data/sample.json'
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var requestType = spy.getCall(0).args[1];

        expect(requestType).to.equal('json');

        done();
      });
    });

    it('should invoke callback with an error if the data handling fails', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: 'base/test_data/404-file.json'
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.not.be.ok;

        done();
      });
    });

    it('should invoke callback with an error if the data handling fails due to a network error', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: 'file:///test.json'
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal('XHR Failed');
        expect(waveformData).to.equal(undefined);

        done();
      });
    });

    it('should use the JSON dataUri connector', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var url = spy.getCall(0).args[0];

        expect(url).to.equal(peaks.options.dataUri.json);

        done();
      });
    });

    it('should not use credentials if withCredentials is not set', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var xhr = spy.getCall(0).returnValue;

        expect(xhr.withCredentials).to.equal(false);

        done();
      });
    });

    it('should use credentials if withCredentials is set', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          withCredentials: true,
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var xhr = spy.getCall(0).returnValue;

        expect(xhr.withCredentials).to.equal(true);

        done();
      });
    });

    ('ArrayBuffer' in window) && it('should use the arraybuffer dataUri connector', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var url = spy.getCall(0).args[0];

        expect(url).to.equal(peaks.options.dataUri.arraybuffer);

        done();
      });
    });

    !('ArrayBuffer' in window) && it('invoke callback with an error if the only available format is browser incompatible', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.match(/Unable to determine/);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    ('ArrayBuffer' in window) && it('invoke callback with an error if arraybuffer data is invalid', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            arraybuffer: 'foo'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.match(/Unable to determine/);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    it('should use the waveformData json data connector', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            json: sampleJsonData
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);
        done();
      });
    });

    it('should throw if waveformData json data is invalid', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            json: { test: 'foo' }
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.not.be.ok;
        done();
      });
    });

    it('should prefer binary waveform data over JSON', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat',
            json: 'base/test_data/sample.json'
          }
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      var spy = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        var url = spy.getCall(0).args[0];
        var expectedDataUri = window.ArrayBuffer ? peaks.options.dataUri.arraybuffer : peaks.options.dataUri.json;

        expect(url).to.equal(expectedDataUri);

        done();
      });
    });

    it('should build using WebAudio if the API is available and audioContext is provided', function(done) {
      var peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          webAudio: {
            audioContext: new TestAudioContext(),
            scale: 512
          },
          zoomLevels: [512, 1024, 2048, 4096]
        }
      };

      var waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);
        done();
      });
    });
  });
});
