define(['peaks'], function (Peaks) {
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
        p.points.add(10, true, "#ff0000", "A point");
        p.points.add(12, true, "#ff0000", "Another point");
        expect(p.points.getPoints()).to.have.length.of(2);
      });
    });


    describe("add", function () {
      it("should create a point with the mandatory values as arguments, override default color", function () {
        p.points.add(10, true, "#00FF00", "A point");

        var point = p.points.getPoints()[0];
        expect(p.points.getPoints()).to.have.a.lengthOf(1).and.to.have.deep.property('[0].timestamp', 10);
        expect(p.points.getPoints()).to.have.deep.property('[0].id', 'point0');
        expect(p.points.getPoints()).to.have.deep.property('[0].color', '#00FF00');
      });

      it("should create a point with mandatory and optional values as arguments", function() {
        p.points.add(10, true, "#ff0000", "A Point", 0);

        var point = p.points.getPoints()[0];
        expect(p.points.getPoints().length).to.equal(1);
        expect(point.id).to.equal(0);
        expect(point.timestamp).to.equal(10);

      });

      it("should accept an array of point objects without ids", function () {
        var points = [
          { timestamp: 10, editable: true, color: "#ff0000", labelText: "A point"},
          { timestamp: 12, editable: true, color: "#ff0000", labelText: "Another point"}
        ];

        p.points.add(points);

        expect(p.points.getPoints()).to.have.length.of(2);
        expect(p.points.getPoints()[1]).to.include.keys('timestamp', 'labelText');
        expect(p.points.getPoints()).to.have.deep.property('[0].id', 'point0');
        expect(p.points.getPoints()).to.have.deep.property('[1].id', 'point1');
      });

      it("should accept an array of point objects with numeric ids", function() {
        var points = [
          { timestamp: 10, editable: true, color: "#ff0000", labelText: "A point", id: 0},
          { timestamp: 12, editable: true, color: "#ff0000", labelText: "Another point", id: 1}
        ];
        
        p.points.add(points);

        expect(p.points.getPoints()).to.have.length.of(2);
        expect(p.points.getPoints()[1]).to.include.keys('timestamp', 'labelText');
        expect(p.points.getPoints()).to.have.deep.property('[0].id', 0);
        expect(p.points.getPoints()).to.have.deep.property('[1].id', 1);
      });

      it("should accept an array of point objects with string ids", function() {
        var points = [
          { timestamp: 10, editable: true, color: "#ff0000", labelText: "A point", id: "0"},
          { timestamp: 12, editable: true, color: "#ff0000", labelText: "Another point", id: "1"}
        ];
        
        p.points.add(points);

        expect(p.points.getPoints()).to.have.length.of(2);
        expect(p.points.getPoints()[1]).to.include.keys('timestamp', 'labelText');
        expect(p.points.getPoints()).to.have.deep.property('[0].id', "0");
        expect(p.points.getPoints()).to.have.deep.property('[1].id', "1");
      });

      it("should throw an exception if argument is an object", function () {
        expect(function () {
          p.points.add({ timestamp: 10, editable: true, color: "#ff0000", labelText: "A point"});
        }).to.throw(TypeError);
      });

      it("should throw an exception if arguments are empty", function () {
        expect(function () {
          p.points.add();
        }).to.throw(TypeError);
      });

      it("should throw an exception if timestamp argument is undefined", function () {
        expect(function () {
          p.points.add(undefined);
        }).to.throw(TypeError);
      });

      it("should throw an exception if timestamp argument is null", function () {
        expect(function () {
          p.points.add(null);
        }).to.throw(TypeError);
      });

      it("should throw an exception if the timestamp argument is missing", function () {
        expect(function () {
          p.points.add(NaN);
        }).to.throw(RangeError);

        expect(function () {
          p.points.add([
            {editable: true }
          ]);
        }).to.throw(RangeError);
      });

    });

    describe("removeByTime", function () {
      beforeEach(function(){
        p.points.add(10, true, "#ff0000", "A point");
        p.points.add(12, false, "#ff0000", "Another point");
      });

      it("should remove one of the points", function () {
        p.points.removeByTime(10);

        expect(p.points.getPoints()).to.have.length.of(1);
      });

      it("should let the other point intact", function(){
        p.points.removeByTime(10);

        expect(p.points.getPoints()).to.have.deep.property('[0].id', 'point1');
      });
    });

    describe("removeById", function() {
      beforeEach(function(){
        p.points.add(10, true, "#ff0000", "A point", 1);
        p.points.add(12, false, "#ff0000", "Another point");
      });

      it("should remove one of the points", function() {
        p.points.removeById(1);

        expect(p.points.getPoints()).to.have.length.of(1);
      });

      it("should let the other point intact", function() {
        p.points.removeById('point0');

        expect(p.points.getPoints()).to.have.deep.property('[0].id', 1);
      });
    });

  });

});
