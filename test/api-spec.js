import Peaks from '../src/main';
import Scrollbar from '../src/scrollbar';
import WaveformOverview from '../src/waveform-overview';
import WaveformZoomView from '../src/waveform-zoomview';

import sampleJsonData from '../test_data/sample.json';

import WaveformData from 'waveform-data';
import Konva from 'konva';

const TestAudioContext = window.AudioContext || window.mozAudioContext || window.webkitAudioContext;

const externalPlayer = {
  init: function() { return Promise.resolve(); },
  destroy: function() {},
  play: function() {},
  pause: function() {},
  seek: function() {},
  isPlaying: function() {},
  isSeeking: function() {},
  getCurrentTime: function() {},
  getDuration: function() {}
};

describe('Peaks', function() {
  let p = null;

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  describe('init', function() {
    context('with valid options', function() {
      it('should invoke callback when initialised', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        },
        function(err, instance) {
          expect(err).to.equal(null);
          expect(instance).to.be.an.instanceOf(Peaks);
          instance.destroy();
          done();
        });
      });

      it('should return the peaks instance', function(done) {
        const result = Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        },
        function(err, instance) {
          expect(err).to.equal(null);
          expect(instance).to.be.an.instanceOf(Peaks);
          expect(result).to.equal(instance);
          instance.destroy();
          done();
        });
      });

      it('should emit a peaks.ready event when initialised', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        },
        function(err, instance) {
          expect(err).to.equal(null);
          expect(instance).to.be.an.instanceOf(Peaks);

          instance.on('peaks.ready', function() {
            expect(instance.getWaveformData()).to.be.an.instanceOf(WaveformData);
            done();
          });
        });
      });

      context('with zoomview and overview options', function() {
        it('should construct a Peaks object with overview and zoomable waveforms', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);
            expect(instance.views.getView('overview')).to.be.an.instanceOf(WaveformOverview);
            expect(instance.views.getView('zoomview')).to.be.an.instanceOf(WaveformZoomView);
            done();
          });
        });

        it('should construct a Peaks object with an overview waveform only', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);
            expect(instance.views.getView('overview')).to.be.an.instanceOf(WaveformOverview);
            expect(instance.views.getView('zoomview')).to.equal(null);
            done();
          });
        });

        it('should construct a Peaks object with a zoomable waveform only', function(done) {
          Peaks.init({
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);
            expect(instance.views.getView('overview')).to.equal(null);
            expect(instance.views.getView('zoomview')).to.be.an.instanceOf(WaveformZoomView);

            done();
          });
        });

        it('should return an error if no containers are given', function(done) {
          Peaks.init({
            zoomview: {
            },
            overview: {
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.message).to.match(/must be valid HTML elements/);
            expect(instance).to.equal(undefined);
            done();
          });
        });

        it('should use view-specific options', function(done) {
          function overviewFormatPlayheadTime() { }
          function zoomviewFormatPlayheadTime() { }

          Peaks.init({
            overview: {
              container: document.getElementById('overview-container'),
              playheadColor: '#ff0000',
              playheadTextColor: '#00ff00',
              showPlayheadTime: true,
              formatPlayheadTime: overviewFormatPlayheadTime,
              axisLabelColor: '#0000ff',
              axisGridlineColor: '#000000',
              highlightColor: '#808080',
              highlightOffset: 2,
              highlightStrokeColor: '#404040',
              highlightOpacity: 0.5,
              highlightCornerRadius: 5
            },
            zoomview: {
              container: document.getElementById('zoomview-container'),
              playheadColor: '#00ff00',
              playheadTextColor: '#0000ff',
              showPlayheadTime: false,
              formatPlayheadTime: zoomviewFormatPlayheadTime,
              axisLabelColor: '#ff0000',
              axisGridlineColor: '#808080'
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);

            const overview = instance.views.getView('overview');
            const zoomview = instance.views.getView('zoomview');

            expect(overview._playheadLayer._playheadColor).to.equal('#ff0000');
            expect(zoomview._playheadLayer._playheadColor).to.equal('#00ff00');
            expect(overview._playheadLayer._playheadTextColor).to.equal('#00ff00');
            expect(zoomview._playheadLayer._playheadTextColor).to.equal('#0000ff');
            expect(overview._playheadLayer._playheadText).to.be.an.instanceOf(Konva.Text);
            expect(zoomview._playheadLayer._playheadText).to.equal(undefined);
            expect(overview._formatPlayheadTime).to.equal(overviewFormatPlayheadTime);
            expect(zoomview._formatPlayheadTime).to.equal(zoomviewFormatPlayheadTime);
            expect(overview._axis._axisLabelColor).to.equal('#0000ff');
            expect(zoomview._axis._axisLabelColor).to.equal('#ff0000');
            expect(overview._axis._axisGridlineColor).to.equal('#000000');
            expect(zoomview._axis._axisGridlineColor).to.equal('#808080');
            expect(overview._highlightLayer._offset).to.equal(2);
            expect(overview._highlightLayer._color).to.equal('#808080');
            expect(overview._highlightLayer._strokeColor).to.equal('#404040');
            expect(overview._highlightLayer._opacity).to.equal(0.5);
            expect(overview._highlightLayer._cornerRadius).to.equal(5);
            done();
          });
        });

        it('should use global options', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' },
            playheadColor: '#ff0000',
            playheadTextColor: '#00ff00',
            showPlayheadTime: true,
            axisLabelColor: '#0000ff',
            axisGridlineColor: '#000000',
            highlightColor: '#808080',
            highlightOffset: 2,
            highlightStrokeColor: '#404040',
            highlightOpacity: 0.5,
            highlightCornerRadius: 5
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);

            const overview = instance.views.getView('overview');
            const zoomview = instance.views.getView('zoomview');

            expect(overview._playheadLayer._playheadColor).to.equal('#ff0000');
            expect(zoomview._playheadLayer._playheadColor).to.equal('#ff0000');
            expect(overview._playheadLayer._playheadTextColor).to.equal('#00ff00');
            expect(zoomview._playheadLayer._playheadTextColor).to.equal('#00ff00');
            expect(overview._playheadLayer._playheadText).to.equal(undefined);
            expect(zoomview._playheadLayer._playheadText).to.be.an.instanceOf(Konva.Text);
            expect(overview._axis._axisLabelColor).to.equal('#0000ff');
            expect(zoomview._axis._axisLabelColor).to.equal('#0000ff');
            expect(overview._axis._axisGridlineColor).to.equal('#000000');
            expect(zoomview._axis._axisGridlineColor).to.equal('#000000');
            expect(overview._highlightLayer._offset).to.equal(2);
            expect(overview._highlightLayer._color).to.equal('#808080');
            expect(overview._highlightLayer._strokeColor).to.equal('#404040');
            expect(overview._highlightLayer._opacity).to.equal(0.5);
            expect(overview._highlightLayer._cornerRadius).to.equal(5);
            done();
          });
        });

        it('should use default options', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);

            const overview = instance.views.getView('overview');
            const zoomview = instance.views.getView('zoomview');

            expect(overview._playheadLayer._playheadColor).to.equal('#111111');
            expect(zoomview._playheadLayer._playheadColor).to.equal('#111111');
            expect(overview._playheadLayer._playheadTextColor).to.equal('#aaaaaa');
            expect(zoomview._playheadLayer._playheadTextColor).to.equal('#aaaaaa');
            expect(overview._playheadLayer._playheadText).to.equal(undefined);
            expect(overview._playheadLayer._playheadText).to.equal(undefined);
            expect(overview._axis._axisLabelColor).to.equal('#aaaaaa');
            expect(zoomview._axis._axisLabelColor).to.equal('#aaaaaa');
            expect(overview._axis._axisGridlineColor).to.equal('#cccccc');
            expect(zoomview._axis._axisGridlineColor).to.equal('#cccccc');
            expect(overview._highlightLayer._offset).to.equal(11);
            expect(overview._highlightLayer._color).to.equal('#aaaaaa');
            expect(overview._highlightLayer._strokeColor).to.equal('transparent');
            expect(overview._highlightLayer._opacity).to.equal(0.3);
            expect(overview._highlightLayer._cornerRadius).to.equal(2);
            done();
          });
        });
      });

      context('with scrollbar option', function() {
        it('should construct a Peaks object with scrollbar', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            scrollbar: {
              container: document.getElementById('scrollbar-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/sample.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceof(Peaks);
            expect(instance.views._scrollbar).to.be.an.instanceOf(Scrollbar);
            done();
          });
        });
      });

      context('with precomputed stereo waveform data', function() {
        it('should initialise correctly', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            dataUri: { arraybuffer: '/base/test_data/07023003-2channel.dat' }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceOf(Peaks);
            expect(instance.getWaveformData().channels).to.equal(2);
            instance.destroy();
            done();
          });
        });
      });

      context('with valid JSON waveform data', function() {
        it('should initialise correctly', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            waveformData: {
              json: sampleJsonData
            }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceOf(Peaks);
            expect(instance.getWaveformData().channels).to.equal(1);
            instance.destroy();
            done();
          });
        });
      });

      context('with valid binary waveform data', function() {
        it('should initialise correctly', function(done) {
          fetch('/base/test_data/sample.dat')
            .then(function(response) {
              return response.arrayBuffer();
            })
            .then(function(buffer) {
              Peaks.init({
                overview: {
                  container: document.getElementById('overview-container')
                },
                zoomview: {
                  container: document.getElementById('zoomview-container')
                },
                mediaElement: document.getElementById('media'),
                waveformData: {
                  arraybuffer: buffer
                }
              }, function(err, instance) {
                expect(err).to.equal(null);
                expect(instance).to.be.an.instanceOf(Peaks);
                expect(instance.getWaveformData().channels).to.equal(1);
                instance.destroy();
                done();
              });
            });
        });
      });

      context('with audioContext and multiChannel enabled', function() {
        it('should initialise correctly', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaElement: document.getElementById('media'),
            webAudio: {
              audioContext: new TestAudioContext(),
              multiChannel: true
            }
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceOf(Peaks);
            expect(instance.getWaveformData().channels).to.equal(2);
            instance.destroy();
            done();
          });
        });
      });

      context('with audioBuffer', function() {
        it('should initialise correctly', function(done) {
          const audioContext = new TestAudioContext();

          fetch('/base/test_data/sample.mp3')
            .then(function(response) {
              return response.arrayBuffer();
            })
            .then(function(buffer) {
              return audioContext.decodeAudioData(buffer);
            })
            .then(function(audioBuffer) {
              Peaks.init({
                overview: {
                  container: document.getElementById('overview-container')
                },
                zoomview: {
                  container: document.getElementById('zoomview-container')
                },
                mediaElement: document.getElementById('media'),
                webAudio: {
                  audioBuffer: audioBuffer,
                  multiChannel: true
                },
                zoomLevels: [128, 256]
              }, function(err, instance) {
                expect(err).to.equal(null);
                expect(instance).to.be.an.instanceOf(Peaks);
                expect(instance.getWaveformData().channels).to.equal(2);
                instance.destroy();
                done();
              });
            });
        });
      });

      context('with external player', function() {
        it('should ignore mediaUrl if using an external player', function(done) {
          Peaks.init({
            overview: {
              container: document.getElementById('overview-container')
            },
            zoomview: {
              container: document.getElementById('zoomview-container')
            },
            mediaUrl: 'invalid',
            waveformData: {
              json: sampleJsonData
            },
            player: externalPlayer
          }, function(err, instance) {
            expect(err).to.equal(null);
            expect(instance).to.be.an.instanceOf(Peaks);
            instance.destroy();
            done();
          });
        });
      });
    });

    context('with invalid options', function() {
      it('should invoke callback with an error if options is not an object', function(done) {
        Peaks.init([], function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/should be an object/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if no mediaElement is provided', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/Missing mediaElement option/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if mediaElement is not an HTMLMediaElement', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.createElement('div'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(TypeError);
          expect(err.message).to.match(/HTMLMediaElement/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if both a dataUri and audioContext are provided', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' },
          webAudio: {
            audioContext: new TestAudioContext()
          }
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(TypeError);
          expect(err.message).to.match(/only pass one/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if neither a dataUri nor an audioContext are provided', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media')
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/audioContext, or dataUri, or waveformData/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the dataUri is not an object', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: true
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(TypeError);
          expect(err.message).to.match(/dataUri/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the provided JSON waveform data is invalid', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          waveformData: {
            json: { data: 'foo' }
          }
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if provided binary waveform data is invalid', function(done) {
        fetch('/base/test_data/unknown.dat')
          .then(function(response) {
            return response.arrayBuffer();
          })
          .then(function(buffer) {
            Peaks.init({
              overview: {
                container: document.getElementById('overview-container')
              },
              zoomview: {
                container: document.getElementById('zoomview-container')
              },
              mediaElement: document.getElementById('media'),
              waveformData: {
                arraybuffer: buffer
              }
            }, function(err, instance) {
              expect(err).to.be.an.instanceOf(Error);
              expect(instance).to.equal(undefined);
              done();
            });
          });
      });

      it('should invoke callback with an error if no zoomview or overview options are provided', function(done) {
        Peaks.init({
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/must be valid HTML elements/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the logger is defined and not a function', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          },
          logger: 'foo'
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(TypeError);
          expect(err.message).to.match(/logger/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomLevels option is missing', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          },
          zoomLevels: null
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/zoomLevels/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomLevels option is empty', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          },
          zoomLevels: []
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/zoomLevels/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomLevels option is not in ascending order', function(done) {
        Peaks.init({
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          },
          zoomLevels: [1024, 512]
        }, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/zoomLevels/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomview container element has zero width', function(done) {
        const container = document.getElementById('zoomview-container');
        container.style.width = '0px';

        const options = {
          zoomview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/width/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomview container element has zero height', function(done) {
        const container = document.getElementById('zoomview-container');
        container.style.height = '0px';

        const options = {
          zoomview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/height/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the overview container element has zero width', function(done) {
        const container = document.getElementById('overview-container');
        container.style.width = '0px';

        const options = {
          overview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/width/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the overview container element has zero height', function(done) {
        const container = document.getElementById('overview-container');
        container.style.height = '0px';

        const options = {
          overview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/height/);
          expect(instance).to.equal(undefined);
          done();
        });
      });

      it('should invoke callback with an error if the zoomview container element has zero height after initialisation', function(done) {
        const container = document.getElementById('zoomview-container');

        const options = {
          zoomview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/height/);
          expect(instance).to.equal(undefined);
          done();
        });

        container.style.height = '0px';
      });

      it('should invoke callback with an error if the overview container element has zero height after initialisation', function(done) {
        const container = document.getElementById('overview-container');

        const options = {
          overview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            arraybuffer: 'base/test_data/sample.dat'
          }
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.match(/height/);
          expect(instance).to.equal(undefined);
          done();
        });

        container.style.height = '0px';
      });
    });
  });

  describe('setSource', function() {
    let drawWaveformLayer;

    beforeEach(function(done) {
      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: '/base/test_data/sample.dat' },
        zoomLevels: [512, 1024, 2048]
      };

      Peaks.init(options, function(err, instance) {
        expect(err).to.equal(null);

        p = instance;

        const zoomview = instance.views.getView('zoomview');
        expect(zoomview).to.be.ok;

        drawWaveformLayer = sinon.spy(zoomview, 'drawWaveformLayer');
        done();
      });
    });

    context('with invalid media url', function() {
      it('should return an error', function(done) {
        const options = {
          mediaUrl: '/base/test_data/unknown.mp3',
          dataUri: {
            arraybuffer: '/base/test_data/unknown.dat'
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.an.instanceOf(MediaError);
          done();
        });
      });

      it('should preserve existing event handlers', function(done) {
        const options = {
          mediaUrl: '/base/test_data/unknown.mp3',
          dataUri: {
            arraybuffer: '/base/test_data/unknown.dat'
          }
        };

        function onError() {
          // Nothing
        }

        p.on('player.error', onError);

        p.setSource(options, function(error) {
          expect(error).to.be.an.instanceOf(MediaError);
          expect(p.listeners('player.error').length).to.equal(1);
          done();
        });
      });
    });

    context('with invalid json waveform data', function() {
      it('should return an error', function(done) {
        const options = {
          mediaUrl: '/base/test_data/sample.mp3',
          waveformData: {
            json: { data: 'foo' }
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.an.instanceOf(Error);
          done();
        });
      });
    });

    context('with valid json waveform data', function() {
      it('should update the waveform', function(done) {
        const options = {
          mediaUrl: '/base/test_data/sample.mp3',
          waveformData: {
            json: sampleJsonData
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.undefined;
          expect(drawWaveformLayer.callCount).to.equal(1);
          done();
        });
      });
    });

    context('with waveform data url', function() {
      it('should update the waveform', function(done) {
        const options = {
          mediaUrl: '/base/test_data/sample.mp3',
          dataUri: {
            arraybuffer: '/base/test_data/sample.dat'
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.undefined;
          expect(drawWaveformLayer.callCount).to.equal(1);
          done();
        });
      });
    });

    context('with audioContext', function() {
      it('should update the waveform', function(done) {
        const options = {
          mediaUrl: '/base/test_data/sample.mp3',
          webAudio: {
            audioContext: new TestAudioContext()
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.undefined;
          expect(drawWaveformLayer.callCount).to.equal(1);
          done();
        });
      });
    });

    context('with audioBuffer', function() {
      it('should update the waveform', function(done) {
        const audioContext = new TestAudioContext();

        fetch('/base/test_data/sample.mp3')
          .then(function(response) {
            return response.arrayBuffer();
          })
          .then(function(buffer) {
            return audioContext.decodeAudioData(buffer);
          })
          .then(function(audioBuffer) {
            const options = {
              mediaUrl: '/base/test_data/sample.mp3',
              webAudio: {
                audioBuffer: audioBuffer,
                multiChannel: true
              }
            };

            p.setSource(options, function(error) {
              expect(error).to.be.undefined;
              expect(drawWaveformLayer.callCount).to.equal(1);
              done();
            });
          });
      });
    });

    context('with binary waveform data', function() {
      it('should update the waveform', function(done) {
        fetch('/base/test_data/sample.dat')
          .then(function(response) {
            return response.arrayBuffer();
          })
          .then(function(buffer) {
            const options = {
              mediaUrl: '/base/test_data/sample.mp3',
              waveformData: {
                arraybuffer: buffer
              }
            };

            p.setSource(options, function(error) {
              expect(error).to.be.undefined;
              expect(drawWaveformLayer.callCount).to.equal(1);
              done();
            });
          });
      });
    });

    context('with invalid binary waveform data', function() {
      it('should return an error', function(done) {
        fetch('/base/test_data/unknown.dat')
          .then(function(response) {
            return response.arrayBuffer();
          })
          .then(function(buffer) {
            const options = {
              mediaUrl: '/base/test_data/sample.mp3',
              waveformData: {
                arraybuffer: buffer
              }
            };

            p.setSource(options, function(error) {
              expect(error).to.be.an.instanceOf(Error);
              done();
            });
          });
      });
    });

    context('with zoom levels', function() {
      it('should update the instance zoom levels', function(done) {
        const options = {
          mediaUrl: '/base/test_data/sample.mp3',
          webAudio: {
            audioContext: new TestAudioContext()
          },
          zoomLevels: [128, 256]
        };

        p.setSource(options, function(error) {
          expect(error).to.be.undefined;
          expect(p.zoom.getZoomLevel()).to.equal(128);
          expect(drawWaveformLayer.callCount).to.equal(1);
          done();
        });
      });
    });

    context('with stereo waveform', function() {
      it('should update the waveform', function(done) {
        const options = {
          mediaUrl: '/base/test_data/07023003.mp3',
          dataUri: {
            arraybuffer: '/base/test_data/07023003-2channel.dat'
          },
          zoomLevels: [128, 256]
        };

        p.setSource(options, function(error) {
          expect(error).to.be.undefined;
          expect(p.zoom.getZoomLevel()).to.equal(128);
          expect(drawWaveformLayer.callCount).to.equal(1);
          done();
        });
      });
    });

    context('with missing mediaUrl', function() {
      it('should return an error', function(done) {
        const options = {
          webAudio: {
            audioContext: new TestAudioContext()
          }
        };

        p.setSource(options, function(error) {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.match(/options must contain a mediaUrl/);
          done();
        });
      });
    });
  });

  describe('destroy', function() {
    it('should clean up event listeners', function(done) {
      const errorSpy = sinon.spy().named('window.onerror');
      const oldOnError = window.onerror;
      window.onerror = errorSpy;

      Peaks.init({
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        webAudio: {
          audioContext: new TestAudioContext()
        }
      }, function(err, instance) {
        expect(err).to.equal(null);

        // Give peaks chance to bind its resize listener:
        setTimeout(function() {
          instance.destroy();

          // Fire a resize event, which would normally cause peaks to redraw
          const e = document.createEvent('HTMLEvents');
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
      Peaks.init({
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        scrollbar: {
          container: document.getElementById('scrollbar-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: '/base/test_data/sample.dat' }
      }, function(err, peaks) {
        expect(err).to.equal(null);

        peaks.destroy();
        peaks.destroy();

        done();
      });
    });
  });
});
