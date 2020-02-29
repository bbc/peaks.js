'use strict';

require('./setup');

var Peaks = require('../../src/main');
var ExternalPlayer = require('../../src/player-external');
var Player = require('../../src/player');

describe('External Player', function() {
  var p;
  var currentTime;
  var duration;
  var isSeeking;
  var isPlaying;
  var options;

  beforeEach(function(done) {
    currentTime = 0;
    options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      logger: sinon.spy(),
      player: {
        init: sinon.spy(),
        destroy: sinon.spy(),
        play: sinon.spy(),
        pause: sinon.spy(),
        isPlaying: sinon.spy(function() {return isPlaying;}),
        isSeeking: sinon.spy(function() {return isSeeking;}),
        getCurrentTime: sinon.spy(function() {return currentTime;}),
        getDuration: sinon.spy(function() {return duration;}),
        seek: sinon.spy(),
        playSegment: sinon.spy()
      }
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);
      p = instance;
      done();
    });
  });

  describe('instance', function() {
    it('should be of type external player', function() {
      expect(p.player).to.be.an.instanceof(ExternalPlayer);
      expect(p.player).to.be.an.instanceof(Player);
    });
  });

  describe('constructor', function() {
    it('should throw a type error if an adapter property is missing', function() {
      var adapter = {
        init: function() {}
      };

      expect(function() {new ExternalPlayer(null,adapter);}).to.throw(TypeError);
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
        seek: sinon.spy(),
        playSegment: sinon.spy()
      };

      expect(function() {new ExternalPlayer(null,adapter);}).to.throw(TypeError);
    });
  });

  describe('init', function() {
    it('should have been triggered during initialization of peaks', function() {
      expect(options.player.init.calledOnce);
    });
  });

  describe('destroy', function() {
    it('should be triggered during destroy process', function() {
      expect(options.player.destroy.notCalled);

      p.destroy();

      expect(options.player.destroy.calledOnce);
    });
  });

    describe('play', function() {
      it('should invoke play callback and emit play event', function(done) {
        currentTime = 42;
        p.on('player_play', function(time) {
          expect(time).to.equal(42);
          done();
        });

        p.player.play();

        expect(options.player.play.calledOnce);
      });
    });

    describe('pause', function() {
      it('should invoke pause callback and emit pause event', function(done) {
        p.on('player_pause', function() {
          done();
        });

        p.player.pause();

        expect(options.player.pause.calledOnce);
      });
    });

  describe('isPlaying', function() {
    it('should invoke callback and return its value', function() {
      isPlaying = true;

      expect(p.player.isPlaying()).to.equal(true);
      expect(options.player.isPlaying.calledOnce);
    });
  });

  describe('isSeeking', function() {
    it('should invoke callback and return its value', function() {
      isSeeking = true;

      expect(options.player.isSeeking.calledOnce);
      expect(p.player.isSeeking()).to.equal(true);
    });
  });

  describe('getCurrentTime', function() {
    it('should invoke callback and return its value', function() {
      currentTime = 123;

      expect(p.player.getCurrentTime()).to.equal(123);
      expect(options.player.getCurrentTime.calledOnce);
    });
  });

  describe('getDuration', function() {
    it('should invoke callback and return its value', function() {
      duration = 111;

      expect(options.player.getDuration.calledOnce);
      expect(p.player.getDuration()).to.equal(111);
    });
  });

  describe('seek', function() {
      it('should invoke seek callback and emit seeked and updated time event', function(done) {
        var numberOfTriggeredEvents = 0;
        currentTime = 43;

        p.on('player_seek', function(time) {
          expect(time).to.equal(42);
           p.emit('done');
        });
        p.on('player_time_update', function(time) {
          expect(time).to.equal(43);
          p.emit('done');
        });
        p.on('done', function() {
          numberOfTriggeredEvents++;
          if (numberOfTriggeredEvents === 2) {
            done();
          }
        });

        p.player.seek(42);

        expect(p.logger.notCalled);
        expect(options.player.seek.calledOnce);
        expect(options.player.seek).to.have.been.calledWith(42);
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

    it('should invoke playSegment callback', function() {
      var segment = { startTime: 10, endTime: 20, editable: true };

      p.player.playSegment(segment);

      expect(p.logger.notCalled);

      expect(options.player.playSegment.calledOnce);
      expect(options.player.playSegment).to.have.been.calledWith(segment);
    });
  });
});
