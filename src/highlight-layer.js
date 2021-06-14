/**
 * @file
 *
 * Defines the {@link HighlightLayer} class.
 *
 * @module highlight-layer
 */

import { Layer } from 'konva/lib/Layer';
import { Rect } from 'konva/lib/shapes/Rect';
import { clamp } from './utils.js';

/**
 * Creates the highlight region that shows the position of the zoomable
 * waveform view in the overview waveform.
 *
 * @class
 * @alias HighlightLayer
 *
 * @param {WaveformOverview} view
 * @param {Number} offset
 * @param {String} color
 */
export default class HighlightLayer {
  constructor(view, offset, color) {
    this._view          = view;
    this._offset        = offset;
    this._color         = color;
    this._layer         = new Layer({ listening: false });
    this._highlightRect = null;
    this._startTime     = null;
    this._endTime       = null;
  }

  addToStage(stage) {
    stage.add(this._layer);
  }

  showHighlight(startTime, endTime) {
    if (!this._highlightRect) {
      this._createHighlightRect(startTime, endTime);
    }

    this._update(startTime, endTime);
  }

  /**
   * Updates the position of the highlight region.
   *
   * @param {Number} startTime The start of the highlight region, in seconds.
   * @param {Number} endTime The end of the highlight region, in seconds.
   */

  _update(startTime, endTime) {
    this._startTime = startTime;
    this._endTime = endTime;

    var startOffset = this._view.timeToPixels(startTime);
    var endOffset   = this._view.timeToPixels(endTime);

    this._highlightRect.setAttrs({
      x:     startOffset,
      width: endOffset - startOffset
    });

    this._layer.draw();
  }

  _createHighlightRect(startTime, endTime) {
    this._startTime = startTime;
    this._endTime   = endTime;

    var startOffset = this._view.timeToPixels(startTime);
    var endOffset   = this._view.timeToPixels(endTime);

    // Create with default y and height, the real values are set in fitToView().
    this._highlightRect = new Rect({
      startOffset:  0,
      y:            0,
      width:        endOffset - startOffset,
      stroke:       this._color,
      strokeWidth:  1,
      height:       0,
      fill:         this._color,
      opacity:      0.3,
      cornerRadius: 2
    });

    this.fitToView();

    this._layer.add(this._highlightRect);
  }

  removeHighlight() {
    if (this._highlightRect) {
      this._highlightRect.destroy();
      this._highlightRect = null;
      this._layer.draw();
    }
  }

  updateHighlight() {
    if (this._highlightRect) {
      this._update(this._startTime, this._endTime);
    }
  }

  fitToView() {
    if (this._highlightRect) {
      var height = this._view.getHeight();
      var offset = clamp(this._offset, 0, Math.floor(height / 2));

      this._highlightRect.setAttrs({
        y: offset,
        height: height - (offset * 2)
      });
    }
  }
}
