/**
 * @file
 *
 * Defines the {@link HighlightLayer} class.
 *
 * @module highlight-layer
 */

import Konva from 'konva/lib/Core';
import { Rect } from 'konva/lib/shapes/Rect';

import { clamp } from  './utils';

/**
 * Highlight layer options
 *
 * @typedef {Object} HighlightLayerOptions
 * @global
 * @property {Number} highlightOffset
 * @property {String} highlightColor
 * @property {String} highlightStrokeColor
 * @property {Number} highlightOpacity
 * @property {Number} highlightCornerRadius
 */

/**
 * Creates the highlight region that shows the position of the zoomable
 * waveform view in the overview waveform.
 *
 * @class
 * @alias HighlightLayer
 *
 * @param {WaveformOverview} view
 * @param {HighlightLayerOptions} options
 */

function HighlightLayer(view, options) {
  this._view          = view;
  this._offset        = options.highlightOffset;
  this._color         = options.highlightColor;
  this._layer         = new Konva.Layer({ listening: false });
  this._highlightRect = null;
  this._startTime     = null;
  this._endTime       = null;
  this._strokeColor   = options.highlightStrokeColor;
  this._opacity       = options.highlightOpacity;
  this._cornerRadius  = options.highlightCornerRadius;
}

HighlightLayer.prototype.addToStage = function(stage) {
  stage.add(this._layer);
};

HighlightLayer.prototype.showHighlight = function(startTime, endTime) {
  if (!this._highlightRect) {
    this._createHighlightRect(startTime, endTime);
  }

  this._update(startTime, endTime);
};

/**
 * Updates the position of the highlight region.
 *
 * @param {Number} startTime The start of the highlight region, in seconds.
 * @param {Number} endTime The end of the highlight region, in seconds.
 */

HighlightLayer.prototype._update = function(startTime, endTime) {
  this._startTime = startTime;
  this._endTime = endTime;

  const startOffset = this._view.timeToPixels(startTime);
  const endOffset   = this._view.timeToPixels(endTime);

  this._highlightRect.setAttrs({
    x:     startOffset,
    width: endOffset - startOffset
  });
};

HighlightLayer.prototype._createHighlightRect = function(startTime, endTime) {
  this._startTime = startTime;
  this._endTime   = endTime;

  const startOffset = this._view.timeToPixels(startTime);
  const endOffset   = this._view.timeToPixels(endTime);

  // Create with default y and height, the real values are set in fitToView().
  this._highlightRect = new Rect({
    x:            startOffset,
    y:            0,
    width:        endOffset - startOffset,
    height:       0,
    stroke:       this._strokeColor,
    strokeWidth:  1,
    fill:         this._color,
    opacity:      this._opacity,
    cornerRadius: this._cornerRadius
  });

  this.fitToView();

  this._layer.add(this._highlightRect);
};

HighlightLayer.prototype.removeHighlight = function() {
  if (this._highlightRect) {
    this._highlightRect.destroy();
    this._highlightRect = null;
  }
};

HighlightLayer.prototype.updateHighlight = function() {
  if (this._highlightRect) {
    this._update(this._startTime, this._endTime);
  }
};

HighlightLayer.prototype.fitToView = function() {
  if (this._highlightRect) {
    const height = this._view.getHeight();
    const offset = clamp(this._offset, 0, Math.floor(height / 2));

    this._highlightRect.setAttrs({
      y: offset,
      height: height - (offset * 2)
    });
  }
};

export default HighlightLayer;
