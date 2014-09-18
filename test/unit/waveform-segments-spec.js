define(['peaks'], function(Peaks){

  describe("player/waveform/waveform.segments", function () {

    var sandbox, p;

    beforeEach(function beforeEach(done) {
      sandbox = sinon.sandbox.create();

      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri: {
          json: 'base/test_data/sample.json'
        },
        keyboard: true,
        height: 240
      });

      p.on('segments.ready', done);
    });

    afterEach(function(){
      sandbox.restore();
    });

    describe("addSegment", function(){
      it("should accept spreaded arguments (soon deprecated)", function(){
        var stub = sandbox.stub(p.waveform.segments, 'createSegment');

        p.segments.addSegment(0, 10, false);

        expect(stub.callCount).to.equal(1);
        expect(stub.args[0]).to.deep.equal([0, 10, false, undefined, undefined]);
      });

      it("should accept an array of Segment objects", function(){
        var spy = sandbox.spy(p.waveform.segments, 'createSegment');

        p.segments.addSegment([
          { startTime: 0, endTime: 10, editable: false },
          { startTime: 10, endTime: 20, editable: true, color: 'rgba(255, 161, 39, 1)', labelText: 'dummy text'}
        ]);

        expect(spy.callCount).to.equal(2);
        expect(spy.args[1]).to.deep.equal([10, 20, true, 'rgba(255, 161, 39, 1)', 'dummy text']);
      });

      it("should paint once, and not after each segment addition", function(){
        var spy = sandbox.spy(p.waveform.segments.views[0].segmentLayer, 'draw');

        p.segments.addSegment([
          { startTime: 0, endTime: 10, editable: false },
          { startTime: 10, endTime: 20, editable: true, color: 'rgba(255, 161, 39, 1)', labelText: 'dummy text'}
        ]);

        expect(spy.callCount).to.equal(1);    // currently called as many times as we have segments
      });
    });
  });

});
