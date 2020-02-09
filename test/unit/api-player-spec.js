'use strict';

require('./setup');

var Peaks = require('../../src/main');

describe('Peaks.player', function() {
  var p;

  beforeEach(function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      logger: sinon.spy()
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
    }
  });

  describe('getCurrentTime', function() {
    var newTime = 6.0;

    it('should return the actual value of the audio element', function() {
      expect(p.player.getCurrentTime()).to.equal(0);
    });

    it('should return an updated time if it has been modified through the audio element', function(done) {
      p.on('player_seek', function(currentTime) {
        expect(currentTime).to.equal(p.player.getCurrentTime());

        var diff = Math.abs(currentTime - newTime);
        expect(diff).to.be.lessThan(0.2);

        done();
      });

      document.querySelector('audio').currentTime = newTime;
    });
  });

  describe('seek', function() {
    beforeEach(function() {
      p.player.seek(0.0);
    });

    it('should change the currentTime value of the audio element', function() {
      var newTime = 6.0;

      p.player.seek(newTime);

      var diff = Math.abs(p.player.getCurrentTime() - newTime);
      expect(diff).to.be.lessThan(0.2);
    });

    it('should log an error if the given time is not valid', function() {
      p.player.seek('6.0');

      expect(p.logger.calledOnce);
      expect(p.player.getCurrentTime()).to.equal(0.0);
    });
  });

  describe('playSegment', function() {
    it('should log an error if a segment id is given', function() {
      p.player.playSegment('peaks.segment.0');

      expect(p.logger.calledOnce);
    });

    it('should play a given segment', function() {
      p.segments.add({ startTime: 10, endTime: 20, editable: true });

      var segments = p.segments.getSegments();
      expect(segments.length).to.equal(1);

      p.player.playSegment(segments[0]);
      p.player.pause();

      expect(p.logger.notCalled);
    });

    it('should play a segment if an object with startTime and endTime values is given', function() {
      p.player.playSegment({ startTime: 10, endTime: 20 });
      p.player.pause();

      expect(p.logger.notCalled);
    });
  });

  describe('getCurrentSource', function() {
    it('should return the media url', function() {
      expect(p.player.getCurrentSource()).to.match(/^http:\/\/localhost:\d+\/base\/test_data\/sample.(?:mp3|ogg)$/);
    });
  });

  describe('destroy', function() {
    it('should remove all event listeners', function() {
      p.player.destroy();

      expect(p.player._listeners).to.be.empty;
    });
  });
});
