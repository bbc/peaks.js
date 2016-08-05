(function (Peaks) {
  describe("Peaks.points", function () {

    var p;

    /**
     * SETUP =========================================================
     */

    beforeEach(function (done) {
      p = Peaks.init({
        container:    document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri:      'base/test_data/sample.json',
        keyboard:     true,
        height:       240
      });

      p.on('points.ready', done);
    });

    /**
     * TESTS =========================================================
     */

    describe("getPoints", function () {
      it("should return an empty array by default", function () {
        expect(p.points.getPoints()).to.be.an('array').and.have.length.of(0);
      });

      it("should return any added point", function () {
        p.points.add({timestamp: 10});
        p.points.add({timestamp: 12});
        expect(p.points.getPoints()).to.have.length.of(2);
      });
    });


    describe("add", function () {
      it("should create a segment from the supplied object", function () {
        p.points.add({ timestamp: 10, editable: true, color: "#ff0000", labelText: "A point"});

        var point = p.points.getPoints()[0];

        expect(p.points.getPoints()).to.have.a.lengthOf(1).and.to.have.deep.property('[0].timestamp', 10);
      });

      it("should accept an array of point objects", function () {
        var points = [
          { timestamp: 10, editable: true, color: "#ff0000", labelText: "A point"},
          { timestamp: 12, editable: true, color: "#ff0000", labelText: "Another point"}
        ];

        p.points.add(points);

        expect(p.points.getPoints()).to.have.length.of(2);
        expect(p.points.getPoints()[1]).to.include.keys('timestamp', 'labelText');
      });

      it("should accept spread-arguments (deprecated)", function () {
        p.options.deprecationLogger = function() {}
        p.points.add(10, true, "#ff0000", "A point");
        expect(p.points.getPoints()).to.have.a.lengthOf(1).and.to.have.deep.property('[0].timestamp', 10);
      });

      it("should throw an exception if timestamp argument is undefined", function () {
        expect(function () {
          p.points.add({timestamp: undefined});
        }).to.throw(TypeError);
      });

      it("should throw an exception if timestamp argument is null", function () {
        expect(function () {
          p.points.add({timestamp: null});
        }).to.throw(TypeError);
      });

      it("should throw an exception if the timestamp argument is NaN", function () {
        expect(function () {
          p.options.deprecationLogger = function() {}
          p.points.add(NaN);
        }).to.throw(RangeError);

        expect(function () {
          p.points.add({timestamp: NaN});
        }).to.throw(RangeError);
      });

      it("should throw an exception if the timestamp argument is missing", function () {
        expect(function () {
          p.points.add({});
        }).to.throw(TypeError);

        expect(function () {
          p.points.add([
            {editable: true }
          ]);
        }).to.throw(TypeError);
      });

    });

    describe("removeByTime", function () {
      beforeEach(function(){
        p.points.add({timestamp: 10, editable: true});
        p.points.add({timestamp: 12, editable: false});
      });

      it("should remove one of the point", function () {
        p.points.removeByTime(10);

        expect(p.points.getPoints()).to.have.length.of(1);
      });

      it("should let the other point intact", function(){
        p.points.removeByTime(10);

        expect(p.points.getPoints()).to.have.deep.property('[0].id', 'point1');
        expect(p.points.getPoints()).to.have.deep.property('[0].timestamp', 12);
      });
    });

  });

})(peaks);
