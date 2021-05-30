import WaveformShape from '../../src/waveform-shape';

describe('WaveformShape', function() {
  describe('scaleY', function() {
    context('with default scale', function() {
      it('should scale the maximum amplitude value', function() {
        expect(WaveformShape.scaleY(127, 500, 1.0)).to.equal(0);
      });

      it('should scale the minimum amplitude value', function() {
        expect(WaveformShape.scaleY(-128, 500, 1.0)).to.equal(499);
      });
    });

    context('with half scale', function() {
      it('should scale the maximum amplitude value', function() {
        expect(WaveformShape.scaleY(127, 500, 0.5)).to.equal(124);
      });

      it('should scale the minimum amplitude value', function() {
        expect(WaveformShape.scaleY(-128, 500, 0.5)).to.equal(373);
      });
    });

    context('with double scale', function() {
      it('should scale and clamp the maximum amplitude value', function() {
        expect(WaveformShape.scaleY(127, 500, 2.0)).to.equal(0);
      });

      it('should scale and clamp the minimum amplitude value', function() {
        expect(WaveformShape.scaleY(-128, 500, 2.0)).to.equal(499);
      });
    });
  });
});
