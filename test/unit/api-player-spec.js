define(['peaks', 'Kinetic'], function(Peaks, Kinetic){
  describe("peaks.player interface", function () {

    var p, sandbox, playStub, seekStub;

    /**
     * SETUP =========================================================
     */

    beforeEach(function beforeEach(done) {
      loadAllFixtures();
      sandbox = sinon.sandbox.create();

      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri: 'base/test_data/sample.json',
        keyboard: true,
        height: 240
      });

      playStub = sandbox.stub(p.player, 'play');
      seekStub = sandbox.stub(p.player, 'seekBySeconds');

      p.on('segments.ready', done);
    });

    afterEach(function () {
      removeAllFixtures();
      p.player.pause();
      sandbox.restore();

      playStub = seekStub = null;
    });

    /**
     * TESTS =========================================================
     */

    describe('playFrom', function(){
      xit('should raise an error if the end time is further than the duration', function(){
        expect(function(){
          p.player.playFrom(10000000, 12000000);
        }).to.throw(RangeError);
      });

      it('should raise an error if the startTime is not a valid time value', function (){
        expect(function(){
          p.player.playFrom(NaN);
        }).to.throw(/HTMLMediaElement time value/);
      });

      it('should raise an error if the startTime is not a valid time value', function (){
        expect(function(){
          p.player.playFrom(7, 5);
        }).to.throw(/player.playFrom endTime/);
      });

      it('should request to change the playback to the requested position', function (){
        p.player.playFrom(10, 12);

        expect(seekStub).to.have.been.calledWithExactly(10);
      });

      it('should also start the playback', function (){
        p.player.playFrom(10, 12);

        expect(playStub).to.have.been.calledOnce;
      });

      it('trigger an player_playfrom_end when the endTime is reached', function(done){
        p.on('player_playfrom_end', function(endTime, preventDefault){
          expect(endTime).to.equal(12);
          expect(preventDefault.toString()).to.match(/isPrevented = true/);

          done();
        });

        p.player.playFrom(10, 12);

        p.emit('player_time_update', 12);
      });

      it('should pause the playback by default when the endTime is reached', function(done){
        var pauseStub = sandbox.stub(p.player, 'pause');
        p.player.playFrom(10, 12);

        p.emit('player_time_update', 12);

        setTimeout(function(){
          expect(pauseStub).to.have.been.calledOnce;
          done();
        }, 0);
      });
    });

    describe('playNextSegment', function(){
      beforeEach(function(){
        p.addSegment([
          { startTime: 10, endTime: 15, id: "first" },
          { startTime: 12, endTime: 18, id: "overlapping" },
          { startTime: 12, endTime: 14, id: "contained" },
          { startTime: 20, endTime: 25, id: "sparse" }
        ]);
      });

      it('should return the first segment if ')
    });

  });

});
