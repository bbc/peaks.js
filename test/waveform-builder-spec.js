import WaveformBuilder from '../src/waveform-builder';
import sampleJsonData from '../test_data/sample.json';

import WaveformData from 'waveform-data';

const TestAudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;

describe('WaveformBuilder', function() {
  describe('init', function() {
    it('should not accept a string as dataUri', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: 'base/test_data/sample.json'
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    it('should invoke callback with an error if the data handling fails', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/404-file.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.not.be.ok;

        done();
      });
    });

    it('should invoke callback with an error if the data handling fails due to a network error', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'file:///test.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal('XHR failed');
        expect(waveformData).to.equal(undefined);

        done();
      });
    });

    it('should fetch JSON format waveform data', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const url = createXHR.getCall(0).args[0];

        expect(url).to.equal(peaks.options.dataUri.json);

        done();
      });
    });

    it('should fetch binary format waveform data', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const url = createXHR.getCall(0).args[0];

        expect(url).to.equal(peaks.options.dataUri.arraybuffer);

        done();
      });
    });

    it('should not use credentials if withCredentials is not set', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const xhr = createXHR.getCall(0).returnValue;

        expect(xhr.withCredentials).to.equal(false);

        done();
      });
    });

    it('should use credentials if withCredentials is set', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          withCredentials: true,
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const xhr = createXHR.getCall(0).returnValue;

        expect(xhr.withCredentials).to.equal(true);

        done();
      });
    });

    ('ArrayBuffer' in window) && it('should use the arraybuffer dataUri connector', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const url = createXHR.getCall(0).args[0];

        expect(url).to.equal(peaks.options.dataUri.arraybuffer);

        done();
      });
    });

    !('ArrayBuffer' in window) && it('invoke callback with an error if the only available format is browser incompatible', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.match(/Unable to determine/);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    ('ArrayBuffer' in window) && it('invoke callback with an error if arraybuffer data is invalid', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            arraybuffer: 'foo'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.match(/Unable to determine/);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    it('should use the waveformData json data connector', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            json: sampleJsonData
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);
        done();
      });
    });

    it('should throw if waveformData json data is invalid', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          waveformData: {
            json: { test: 'foo' }
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.equal(undefined);
        done();
      });
    });

    it('should prefer binary waveform data over JSON', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat',
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      const createXHR = sinon.spy(waveformBuilder, '_createXHR');

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        const url = createXHR.getCall(0).args[0];
        const expectedDataUri = window.ArrayBuffer ? peaks.options.dataUri.arraybuffer : peaks.options.dataUri.json;

        expect(url).to.equal(expectedDataUri);

        done();
      });
    });

    it('should return an error given 16-bit waveform data', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample_16bit.dat'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.match(/16-bit waveform data is not supported/);
        expect(waveformData).to.equal(undefined);

        done();
      });
    });

    it('should build using WebAudio if the API is available and audioContext is provided', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          webAudio: {
            audioContext: new TestAudioContext(),
            scale: 512
          },
          zoomLevels: [512, 1024, 2048, 4096]
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);
        done();
      });
    });
  });

  describe('abort', function() {
    it('should abort an HTTP request for waveform data', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      function callback(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.equal(undefined);
        done();
      }

      waveformBuilder.init(peaks.options, callback);
      waveformBuilder.abort();
    });

    it('should abort an HTTP request for audio data', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          webAudio: {
            audioContext: new TestAudioContext(),
            scale: 512
          },
          zoomLevels: [512, 1024, 2048, 4096]
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      function callback(err, waveformData) {
        expect(err).to.be.an.instanceOf(Error);
        expect(waveformData).to.equal(undefined);
        done();
      }

      waveformBuilder.init(peaks.options, callback);
      waveformBuilder.abort();
    });

    it('should do nothing if the HTTP request has not yet been sent', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);
      waveformBuilder.abort();

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        done();
      });
    });

    it('should do nothing if the HTTP request has completed', function(done) {
      const peaks = {
        options: {
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          }
        }
      };

      const waveformBuilder = new WaveformBuilder(peaks);

      waveformBuilder.init(peaks.options, function(err, waveformData) {
        waveformBuilder.abort();

        expect(err).to.equal(null);
        expect(waveformData).to.be.an.instanceOf(WaveformData);

        done();
      });
    });
  });
});
