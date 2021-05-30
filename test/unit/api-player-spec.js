import Peaks from '../../src/main';
import Player from '../../src/player';

describe('Player', function() {
  context('with stub player', function() {
    var p;
    var player;

    beforeEach(function(done) {
      player = {
        init: sinon.spy(),
        destroy: sinon.spy(),
        play: sinon.spy(function() { return 42; }),
        pause: sinon.spy(),
        isPlaying: sinon.spy(function() { return true; }),
        isSeeking: sinon.spy(function() { return false; }),
        getCurrentTime: sinon.spy(function() { return 111; }),
        getDuration: sinon.spy(function() { return 123; }),
        seek: sinon.spy(),
        playSegment: sinon.spy()
      };

      var options = {
        containers: {
          overview: document.getElementById('overview-container'),
          zoomview: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: {
          json: 'base/test_data/sample.json'
        },
        logger: sinon.spy(),
        player: player
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
        p = null;
      }
    });

    describe('constructor', function() {
      it('should throw a type error if an adapter property is missing', function() {
        var adapter = {
          init: function() {}
        };

        expect(function() {
          new Player(null, adapter);
        }).to.throw(TypeError);
      });

      it('should throw a type error if an adapter property is not a function', function() {
        var adapter = {
          init: 'wrong: this should be a function',
          destroy: sinon.spy(),
          play: sinon.spy(),
          pause: sinon.spy(),
          isPlaying: sinon.spy(),
          isSeeking: sinon.spy(),
          getCurrentTime: sinon.spy(),
          getDuration: sinon.spy(),
          seek: sinon.spy()
        };

        expect(function() {
          new Player(null, adapter);
        }).to.throw(TypeError);
      });
    });

    describe('init', function() {
      it("should call the player's init() method", function() {
        expect(player.init.calledOnce);
      });
    });

    describe('destroy', function() {
      it("should call the player's destroy() method", function() {
        expect(player.destroy.notCalled);

        p.destroy();

        expect(player.destroy.calledOnce);
      });
    });

    describe('play', function() {
      it("should call the player's play() method", function() {
        p.player.play();

        expect(player.play.calledOnce);
      });

      it("should return the value from the player's play() method", function() {
        var result = p.player.play();

        expect(result).to.equal(42);
      });
    });

    describe('pause', function() {
      it("should call the player's pause() method", function() {
        p.player.pause();

        expect(player.pause.calledOnce);
      });
    });

    describe('isPlaying', function() {
      it("should call the player's isPlaying() method and return its value", function() {
        expect(p.player.isPlaying()).to.equal(true);
        expect(player.isPlaying.calledOnce);
      });
    });

    describe('isSeeking', function() {
      it("should call the player's isSeeking() method and return its value", function() {
        expect(p.player.isSeeking()).to.equal(false);
        expect(player.isSeeking.calledOnce);
      });
    });

    describe('getCurrentTime', function() {
      it("should call the player's getCurrentTime() method and return its value", function() {
        expect(p.player.getCurrentTime()).to.equal(111);
        expect(player.getCurrentTime.calledOnce);
      });
    });

    describe('getDuration', function() {
      it("should call the player's getDuration() method and return its value", function() {
        expect(p.player.getDuration()).to.equal(123);
        expect(player.getDuration.calledOnce);
      });
    });

    describe('seek', function() {
      it("should call the player's seek() method", function() {
        p.player.seek(42);

        expect(p.logger.notCalled);
        expect(player.seek.calledOnce);
        expect(player.seek).to.have.been.calledWith(42);
      });

      it('should log an error if the given time is not valid', function() {
        p.player.seek('6.0');

        expect(p.logger.calledOnce);
        expect(p.player.seek.notCalled);
      });
    });

    describe('playSegment', function() {
      it('should log an error if a segment id is given', function() {
        p.player.playSegment('peaks.segment.0');

        expect(p.logger.calledOnce);
      });

      it("should call the player's seek(), play() and pause() method", function() {
        var segment = { startTime: 10, endTime: 20, editable: true };

        p.player.playSegment(segment);

        expect(p.logger.notCalled);

        expect(player.seek.calledOnce);
        expect(player.seek).to.have.been.calledWith(segment.startTime);

        expect(player.play.calledOnce);
        expect(player.pause.calledOnce);
      });
    });
  });

  context('with media element player', function() {
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
        p = null;
      }
    });

    describe('play', function() {
      it('should trigger mediaelement playing event', function(done) {
        p.on('player.playing', function(currentTime) {
          expect(currentTime).to.equal(0);
          done();
        });

        p.player.play();
      });
    });

    describe('isSeeking', function() {
      it('should return the actual value of the audio element', function() {
        expect(p.player.isSeeking()).to.equal(document.getElementById('media').seeking);
      });
    });

    describe('getCurrentTime', function() {
      var newTime = 6.0;

      it('should return the actual value of the audio element', function() {
        expect(p.player.getCurrentTime()).to.equal(0);
      });

      it('should return an updated time if it has been modified through the audio element', function(done) {
        p.on('player.seeked', function(currentTime) {
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

      it('should play a segment if an object with startTime and endTime values is given', function(done) {
        var expectedStart = 1;
        var expectedEnd = 2;

        p.player.playSegment({ startTime: expectedStart, endTime: expectedEnd });

        p.on('player.playing', function(currentTime) {
          var diff = Math.abs(currentTime - expectedStart);
          expect(diff).to.be.lessThan(0.05);
        });

        p.on('player.pause', function() {
          var diff = Math.abs(p.player.getCurrentTime() - expectedEnd);
          expect(diff).to.be.lessThan(0.05);
          done();
        });
      });
    });

    describe('destroy', function() {
      it('should remove all event listeners', function() {
        p.player.destroy();

        expect(p.player._adapter._listeners).to.be.empty;
      });
    });
  });
});
