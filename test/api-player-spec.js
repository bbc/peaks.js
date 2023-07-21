import Peaks from '../src/main';
import Player from '../src/player';

describe('Player', function() {
  context('with stub player', function() {
    let p;
    let player;
    let logger;

    beforeEach(function(done) {
      logger = sinon.spy();

      player = {
        init: sinon.spy(function() { return Promise.resolve(); }),
        destroy: sinon.spy(),
        play: sinon.spy(function() { return Promise.resolve(); }),
        pause: sinon.spy(),
        seek: sinon.spy(),
        isPlaying: sinon.spy(function() { return true; }),
        isSeeking: sinon.spy(function() { return false; }),
        getCurrentTime: sinon.spy(function() { return 111; }),
        getDuration: sinon.spy(function() { return 123; })
      };

      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: {
          json: 'base/test_data/sample.json'
        },
        logger: logger,
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
        const adapter = {
          init: function() {}
        };

        expect(function() {
          new Player(null, adapter);
        }).to.throw(TypeError);
      });

      it('should throw a type error if an adapter property is not a function', function() {
        const adapter = {
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
        expect(player.init.calledOnce).to.be.true;
      });
    });

    describe('destroy', function() {
      it("should call the player's destroy() method", function() {
        expect(player.destroy.notCalled).to.equal(true);

        p.destroy();

        expect(player.destroy.calledOnce).to.equal(true);
      });
    });

    describe('play', function() {
      it("should call the player's play() method", function() {
        p.player.play();

        expect(player.play.calledOnce).to.equal(true);
      });

      it("should return the value from the player's play() method", function() {
        const result = p.player.play();

        expect(result).to.be.an.instanceOf(Promise);
      });
    });

    describe('pause', function() {
      it("should call the player's pause() method", function() {
        p.player.pause();

        expect(player.pause.calledOnce).to.equal(true);
      });
    });

    describe('isPlaying', function() {
      it("should call the player's isPlaying() method and return its value", function() {
        const count = player.isPlaying.callCount;
        expect(p.player.isPlaying()).to.equal(true);
        expect(player.isPlaying.callCount).to.equal(count + 1);
      });
    });

    describe('isSeeking', function() {
      it("should call the player's isSeeking() method and return its value", function() {
        expect(p.player.isSeeking()).to.equal(false);
        expect(player.isSeeking.calledOnce).to.equal(true);
      });
    });

    describe('getCurrentTime', function() {
      it("should call the player's getCurrentTime() method and return its value", function() {
        const count = player.getCurrentTime.callCount;
        expect(p.player.getCurrentTime()).to.equal(111);
        expect(player.getCurrentTime.callCount).to.equal(count + 1);
      });
    });

    describe('getDuration', function() {
      it("should call the player's getDuration() method and return its value", function() {
        expect(p.player.getDuration()).to.equal(123);
        expect(player.getDuration.calledOnce).to.equal(true);
      });
    });

    describe('seek', function() {
      it("should call the player's seek() method", function() {
        p.player.seek(42);

        expect(logger.notCalled).to.equal(true);
        expect(player.seek.calledOnce).to.equal(true);
        expect(player.seek).to.have.been.calledWith(42);
      });

      it('should log an error if the given time is not valid', function() {
        p.player.seek('6.0');

        expect(logger.calledOnce).to.equal(true);
        expect(player.seek.notCalled).to.equal(true);
      });
    });

    describe('playSegment', function() {
      it('should return a rejected promise if a segment id is given', function() {
        const result = p.player.playSegment('peaks.segment.0');

        // TODO: check promise is rejected
        expect(result).to.be.an.instanceOf(Promise);
      });

      it("should call the player's seek() and play() methods", function(done) {
        const segment = { startTime: 10, endTime: 20, editable: true };

        p.player.playSegment(segment).then(function() {
          expect(logger.notCalled).to.equal(true);

          expect(player.seek.calledOnce).to.equal(true);
          expect(player.seek).to.have.been.calledWith(segment.startTime);

          expect(player.play.calledOnce).to.equal(true);
          expect(player.pause.notCalled).to.equal(true);
          done();
        });
      });

      it("should return the value from the player's play() method", function() {
        const result = p.player.playSegment({ startTime: 10, endTime: 20 });

        expect(result).to.be.an.instanceOf(Promise);
      });
    });
  });

  context('with media element player', function() {
    let p;
    let logger;

    beforeEach(function(done) {
      logger = sinon.spy();

      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: {
          json: 'base/test_data/sample.json'
        },
        logger: logger
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
      const newTime = 6.0;

      it('should return the actual value of the audio element', function() {
        expect(p.player.getCurrentTime()).to.equal(0);
      });

      it('should return an updated time if it has been modified through the audio element', function(done) {
        p.on('player.seeked', function(currentTime) {
          expect(currentTime).to.equal(p.player.getCurrentTime());

          const diff = Math.abs(currentTime - newTime);
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
        const newTime = 6.0;

        p.player.seek(newTime);

        const diff = Math.abs(p.player.getCurrentTime() - newTime);
        expect(diff).to.be.lessThan(0.2);
      });

      it('should log an error and not seek if the given time is not valid', function() {
        p.player.seek('6.0');

        expect(logger.calledOnce).to.equal(true);
        expect(p.player.getCurrentTime()).to.equal(0.0);
      });
    });

    describe('playSegment', function() {
      it('should return a rejected promise if a segment id is given', function() {
        const result = p.player.playSegment('peaks.segment.0');

        // TODO: check promise is rejected
        expect(result).to.be.an.instanceOf(Promise);
      });

      it('should play a given segment', function() {
        p.segments.add({ startTime: 10, endTime: 20, editable: true });

        const segments = p.segments.getSegments();
        expect(segments.length).to.equal(1);

        p.player.playSegment(segments[0]);
        p.player.pause();

        expect(logger.notCalled).to.equal(true);
      });

      it('should play a segment if an object with startTime and endTime values is given', function(done) {
        const expectedStart = 1;
        const expectedEnd = 2;

        p.player.playSegment({ startTime: expectedStart, endTime: expectedEnd });

        p.on('player.playing', function(currentTime) {
          const diff = Math.abs(currentTime - expectedStart);
          expect(diff).to.be.lessThan(0.05);
        });

        p.on('player.pause', function() {
          const diff = Math.abs(p.player.getCurrentTime() - expectedEnd);
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

  context('with custom player that fails to initialize', function() {
    let p;

    afterEach(function() {
      if (p) {
        p.destroy();
        p = null;
      }
    });

    describe('init', function() {
      it('should cause Peaks.init() to return an error', function(done) {
        const player = {
          init: sinon.spy(function() { return Promise.reject(new Error('failed')); }),
          destroy: sinon.spy(),
          play: sinon.spy(function() { return Promise.resolve(); }),
          pause: sinon.spy(),
          seek: sinon.spy(),
          isPlaying: sinon.spy(function() { return true; }),
          isSeeking: sinon.spy(function() { return false; }),
          getCurrentTime: sinon.spy(function() { return 111; }),
          getDuration: sinon.spy(function() { return 123; })
        };

        const options = {
          overview: {
            container: document.getElementById('overview-container')
          },
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: {
            json: 'base/test_data/sample.json'
          },
          player: player
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('failed');
          p = instance;
          done();
        });
      });
    });
  });
});
