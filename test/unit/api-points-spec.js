define(['peaks', 'Kinetic'], function (Peaks, Kinetic) {
    describe("Peaks.points", function () {

        var p, sandbox;

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

            p.on('points.ready', done);
        });

        /**
         * TEARDOWN ======================================================
         */

        afterEach(function (done) {
            sandbox.restore();
            removeAllFixtures();
            setTimeout(done, 200);
        });

        /**
         * TESTS =========================================================
         */

        describe("getPoints", function () {
            it("should return an empty array by default", function () {
                expect(p.points.getPoints()).to.be.an('array').and.have.length.of(0);
            });

            it("should return any added point", function () {
                p.points.addPoint(10, true, "#ff0000", "A point");
                p.points.addPoint(12, true, "#ff0000", "Another point");
                expect(p.points.getPoints()).to.have.length.of(2);
            });
        });


        describe("addPoint", function () {
            it("should create a segment with the mandatory values as arguments", function () {
                p.points.addPoint(10, true, "#ff0000", "A point");
                var point = p.points.getPoints()[0];

                expect(point.timeStamp).to.equal(10);
                expect(point.editable).to.equal(true);
                expect(point.id).to.equal('point0');
                expect(point.labelText).to.equal('A point');
            });

            it("should accept an array of point objects", function () {
                var points = [
                    { timeStamp: 10, editable: true, color: "#ff0000", labelText: "A point"},
                    { timeStamp: 12, editable: true, color: "#ff0000", labelText: "Another point"}
                ];

                p.points.addPoint(points);

                expect(p.points.getPoints()).to.have.length.of(2);
                expect(p.points.getPoints()[1]).to.include.keys('timeStamp', 'labelText');
            });

            it("should throw an exception if argument is an object", function () {
                expect(function () {
                    p.points.addPoint({ timeStamp: 10, editable: true, color: "#ff0000", labelText: "A point"});
                }).to.throw(TypeError);
            });

            it("should throw an exception if arguments are empty", function () {
                expect(function () {
                    p.points.addPoint();
                }).to.throw(TypeError);
            });

            it("should throw an exception if timeStamp argument is undefined", function () {
                expect(function () {
                    p.points.addPoint(undefined);
                }).to.throw(TypeError);
            });

            it("should throw an exception if timeStamp argument is null", function () {
                expect(function () {
                    p.points.addPoint(null);
                }).to.throw(TypeError);
            });

            it("should throw an exception if the timeStamp argument is missing", function () {
                expect(function () {
                    p.points.addPoint(NaN);
                }).to.throw(RangeError);

                expect(function () {
                    p.points.addPoint([
                        {editable: true }
                    ]);
                }).to.throw(RangeError);
            });

        });

        describe("removePoint", function () {
            it("should remove a point identified by id and reassign ids", function () {
                p.points.addPoint(10, true, "#ff0000", "A point");
                p.points.addPoint(12, false, "#ff0000", "Another point");
                expect(p.points.getPoints()).to.have.length.of(2);
                p.points.removePoint("point0");
                expect(p.points.getPoints()).to.have.length.of(1);

                var point = p.points.getPoints()[0];
                expect(point.timeStamp).to.equal(12);
                expect(point.editable).to.equal(false);
                expect(point.id).to.equal('point0');
                expect(point.labelText).to.equal('Another point');
            });
        });

    });

});
