'use strict';

var Peaks = require('../../src/main');

describe('Peaks.player', function() {
  var p, logger;

  beforeEach(function beforeEach(done) {
    logger = sinon.spy();

    p = Peaks.init({
      container: document.getElementById('waveform-visualiser-container'),
      mediaElement: document.querySelector('audio'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      keyboard: true,
      height: 240,
      logger: logger
    });

    p.on('peaks.ready', done);
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
        var diff = Math.abs(p.player.getCurrentTime() - newTime);
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
});
