import Peaks from '../../src/main';

describe('WaveformOverview', function() {
  let p = null;

  beforeEach(function() {
    const mediaElement = document.createElement('audio');
    mediaElement.id = 'audio';
    mediaElement.src = '/base/test_data/STAT3S3.mp3';
    mediaElement.muted = true;
    document.body.appendChild(mediaElement);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  describe('constructor', function() {
    context('with waveform longer than the container width', function() {
      it('should rescale the waveform to fit the container width', function(done) {
        const container = document.getElementById('overview-container');

        const options = {
          overview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        };

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          p = instance;

          const overview = instance.views.getView('overview');
          expect(overview._data).to.be.ok;

          // TODO: Resampling by width isn't precise
          const diff = Math.abs(overview._data.length - container.offsetWidth);
          expect(diff).to.be.lessThan(2);

          done();
        });
      });
    });

    context('with waveform shorter than the container width', function() {
      it('should use default waveform scale', function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
          },
          mediaElement: document.getElementById('audio'),
          dataUri: { arraybuffer: '/base/test_data/STAT3S3.dat' }
        };

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          p = instance;

          const view = instance.views.getView();
          expect(view._data).to.be.ok;
          expect(view._data.scale).to.equal(32);
          done();
        });
      });
    });
  });
});
