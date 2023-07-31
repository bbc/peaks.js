/**
 * @file
 *
 * Defines the {@link Scrollbar} class.
 *
 * @module scrollbar
 */

import { clamp } from './utils';

import Konva from 'konva/lib/Core';
import { Rect } from 'konva/lib/shapes/Rect';

/**
 * Creates a scrollbar.
 *
 * @class
 * @alias Scrollbar
 *
 * @param {WaveformData} waveformData
 * @param {HTMLElement} container
 * @param {Peaks} peaks
 */

function Scrollbar(waveformData, container, peaks) {
  this._waveformData = waveformData;
  this._container = container;
  this._peaks = peaks;
  this._options = peaks.options.scrollbar;
  this._zoomview = peaks.views.getView('zoomview');

  this._dragBoundFunc = this._dragBoundFunc.bind(this);
  this._onScrollboxDragStart = this._onScrollboxDragStart.bind(this);
  this._onScrollboxDragMove = this._onScrollboxDragMove.bind(this);
  this._onScrollboxDragEnd = this._onScrollboxDragEnd.bind(this);
  this._onZoomviewDisplaying = this._onZoomviewDisplaying.bind(this);
  this._onScrollbarClick = this._onScrollbarClick.bind(this);

  peaks.on('zoomview.displaying', this._onZoomviewDisplaying);

  this._width = container.clientWidth;
  this._height = container.clientHeight;

  this._stage = new Konva.Stage({
    container: container,
    width: this._width,
    height: this._height
  });

  this._layer = new Konva.Layer();
  this._stage.on('click', this._onScrollbarClick);

  this._stage.add(this._layer);

  this._color = this._options.color;
  this._scrollboxX = 0;
  this._minScrollboxWidth = this._options.minWidth;

  this._offsetY = 0;

  this._scrollbox = new Konva.Group({
    draggable:     true,
    dragBoundFunc: this._dragBoundFunc
  });

  this._scrollboxRect = new Rect({
    x:      this._scrollboxX,
    y:      this._offsetY,
    width:  0,
    height: this._height,
    fill:   this._color
  });

  this._scrollbox.add(this._scrollboxRect);
  this._setScrollboxWidth();

  this._scrollbox.on('dragstart', this._onScrollboxDragStart);
  this._scrollbox.on('dragmove', this._onScrollboxDragMove);
  this._scrollbox.on('dragend', this._onScrollboxDragEnd);

  this._layer.add(this._scrollbox);
  this._layer.draw();
}

Scrollbar.prototype.setZoomview = function(zoomview) {
  this._zoomview = zoomview;

  this._updateScrollbarWidthAndPosition();
};

/**
 * Sets the width of the scrollbox, based on the visible waveform region
 * in the zoomview and minimum scrollbox width option.
 */

Scrollbar.prototype._setScrollboxWidth = function() {
  if (this._zoomview) {
    this._scrollboxWidth = Math.floor(
      this._width * this._zoomview.pixelsToTime(this._zoomview.getWidth()) /
        this._peaks.player.getDuration()
    );

    if (this._scrollboxWidth < this._minScrollboxWidth) {
      this._scrollboxWidth = this._minScrollboxWidth;
    }
  }
  else {
    this._scrollboxWidth = this._width;
  }

  this._scrollboxRect.width(this._scrollboxWidth);
};

/**
 * @returns {Number} The maximum scrollbox position, in pixels.
 */

Scrollbar.prototype._getScrollbarRange = function() {
  return this._width - this._scrollboxWidth;
};

Scrollbar.prototype._dragBoundFunc = function(pos) {
  // Allow the scrollbar to be moved horizontally but not vertically.
  return {
    x: pos.x,
    y: 0
  };
};

Scrollbar.prototype._onScrollboxDragStart = function() {
  this._dragging = true;
};

Scrollbar.prototype._onScrollboxDragEnd = function() {
  this._dragging = false;
};

Scrollbar.prototype._onScrollboxDragMove = function() {
  const range = this._getScrollbarRange();
  const x = clamp(this._scrollbox.x(), 0, range);

  this._scrollbox.x(x);

  if (x !== this._scrollboxX) {
    this._scrollboxX = x;

    if (this._zoomview) {
      this._updateWaveform(x);
    }
  }
};

Scrollbar.prototype._onZoomviewDisplaying = function(/* startTime , endTime */) {
  if (!this._dragging) {
    this._updateScrollbarWidthAndPosition();
  }
};

Scrollbar.prototype._updateScrollbarWidthAndPosition = function() {
  this._setScrollboxWidth();

  if (this._zoomview) {
    const startTime = this._zoomview.getStartTime();

    const zoomviewRange = this._zoomview.getPixelLength() - this._zoomview.getWidth();

    const scrollBoxPos = Math.floor(
      this._zoomview.timeToPixels(startTime) * this._getScrollbarRange() / zoomviewRange
    );

    this._scrollbox.x(scrollBoxPos);
    this._layer.draw();
  }
};

Scrollbar.prototype._onScrollbarClick = function(event) {
  // Handle clicks on the scrollbar outside the scrollbox.
  if (event.target === this._stage) {
    if (this._zoomview) {
      // Centre the scrollbox where the user clicked.
      let x = Math.floor(event.evt.layerX - this._scrollboxWidth / 2);

      if (x < 0) {
        x = 0;
      }

      this._updateWaveform(x);
    }
  }
};

/**
 * Sets the zoomview waveform position based on scrollbar position.
 */

Scrollbar.prototype._updateWaveform = function(x) {
  const offset = Math.floor(
    (this._zoomview.getPixelLength() - this._zoomview.getWidth()) * x / this._getScrollbarRange()
  );

  this._zoomview.updateWaveform(offset);
};

Scrollbar.prototype.fitToContainer = function() {
  if (this._container.clientWidth === 0 && this._container.clientHeight === 0) {
    return;
  }

  if (this._container.clientWidth !== this._width) {
    this._width = this._container.clientWidth;
    this._stage.width(this._width);

    this._updateScrollbarWidthAndPosition();
  }

  this._height = this._container.clientHeight;
  this._stage.height(this._height);
};

Scrollbar.prototype.destroy = function() {
  this._layer.destroy();

  this._stage.destroy();
  this._stage = null;
};

export default Scrollbar;
