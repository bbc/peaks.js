/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module peaks/views/ref-segment
 */
define(['konva'], function(Konva) {
  'use strict';

  return {
    install: function(view, peaks) {
      var refLayer = new Konva.Layer();
      var waveformData = view.data;
      var highlightRect = new Konva.Rect({
        x: 0,
        y: 11,
        width: 0,
        stroke: peaks.options.overviewHighlightRectangleColor,
        strokeWidth: 1,
        height: view.height - (11 * 2),
        fill: peaks.options.overviewHighlightRectangleColor,
        opacity: 0.3,
        cornerRadius: 2
      });

      refLayer.add(highlightRect);
      view.stage.add(refLayer);

      return {
        subscribeTo: function refSegmentSubscribeTo(renderEventName) {
          peaks.on(renderEventName, function(timeIn, timeOut) {
           if (isNaN(timeIn)) {
             // eslint-disable-next-line max-len
             throw new Error('WaveformOverview#updateRefWaveform timeIn parameter is not a number: ' + timeIn);
           }

           if (isNaN(timeOut)) {
             // eslint-disable-next-line max-len
             throw new Error('WaveformOverview#updateRefWaveform timeOut parameter is not a number: ' + timeOut);
           }

           var offsetIn = waveformData.at_time(timeIn);
           var offsetOut = waveformData.at_time(timeOut);

           waveformData.set_segment(offsetIn, offsetOut, 'zoom');

           highlightRect.setAttrs({
             x: waveformData.segments.zoom.offset_start - waveformData.offset_start,
             width: waveformData.at_time(timeOut) - waveformData.at_time(timeIn)
           });

           refLayer.draw();
          });
        }
      };
    }
  };
});
