/**
 * @file
 *
 * Defines the {@link SegmentShape} class.
 *
 * @module segment-shape
 */

import Konva from 'konva/lib/Core';

import OverlaySegmentMarker from './overlay-segment-marker';
import SegmentMarker from './segment-marker';
import WaveformShape from './waveform-shape';
import { clamp, objectHasProperty } from './utils';

const defaultFontFamily = 'sans-serif';
const defaultFontSize = 10;
const defaultFontShape = 'normal';

/**
 * Options that control segments' visual appearance
 *
 * @typedef {Object} SegmentDisplayOptions
 * @global
 * @property {Boolean} markers
 * @property {Boolean} overlay
 * @property {String} startMarkerColor
 * @property {String} endMarkerColor
 * @property {String} waveformColor
 * @property {String} overlayColor
 * @property {Number} overlayOpacity
 * @property {String} overlayBorderColor
 * @property {Number} overlayBorderWidth
 * @property {Number} overlayCornerRadius
 * @property {Number} overlayOffset
 * @property {String} overlayLabelAlign
 * @property {String} overlayLabelVerticalAlign
 * @property {Number} overlayLabelPadding
 * @property {String} overlayLabelColor
 * @property {String} overlayFontFamily
 * @property {Number} overlayFontSize
 * @property {String} overlayFontStyle
 */

/**
 * Creates a waveform segment shape with optional start and end markers.
 *
 * @class
 * @alias SegmentShape
 *
 * @param {Segment} segment
 * @param {Peaks} peaks
 * @param {SegmentsLayer} layer
 * @param {WaveformOverview|WaveformZoomView} view
 */

function SegmentShape(segment, peaks, layer, view) {
  this._segment     = segment;
  this._peaks       = peaks;
  this._layer       = layer;
  this._view        = view;
  this._label       = null;
  this._startMarker = null;
  this._endMarker   = null;
  this._color       = segment.color;
  this._borderColor = segment.borderColor;
  this._draggable   = this._segment.editable && this._view.isSegmentDraggingEnabled();
  this._dragging    = false;

  const segmentOptions = view.getViewOptions().segmentOptions;

  this._overlayOffset = segmentOptions.overlayOffset;

  if (!segmentOptions.overlay) {
    this._waveformShape = new WaveformShape({
      color:   segment.color,
      view:    view,
      segment: segment
    });
  }

  this._onMouseEnter  = this._onMouseEnter.bind(this);
  this._onMouseLeave  = this._onMouseLeave.bind(this);
  this._onMouseDown   = this._onMouseDown.bind(this);
  this._onMouseUp     = this._onMouseUp.bind(this);
  this._onClick       = this._onClick.bind(this);
  this._onDblClick    = this._onDblClick.bind(this);
  this._onContextMenu = this._onContextMenu.bind(this);

  this._dragBoundFunc      = this._dragBoundFunc.bind(this);
  this._onSegmentDragStart = this._onSegmentDragStart.bind(this);
  this._onSegmentDragMove  = this._onSegmentDragMove.bind(this);
  this._onSegmentDragEnd   = this._onSegmentDragEnd.bind(this);

  // Event handlers for markers
  this._onSegmentMarkerDragStart   = this._onSegmentMarkerDragStart.bind(this);
  this._onSegmentMarkerDragMove    = this._onSegmentMarkerDragMove.bind(this);
  this._onSegmentMarkerDragEnd     = this._onSegmentMarkerDragEnd.bind(this);
  this._segmentMarkerDragBoundFunc = this._segmentMarkerDragBoundFunc.bind(this);

  this._label = this._peaks.options.createSegmentLabel({
    segment:    segment,
    view:       this._view.getName(),
    layer:      this._layer,
    fontFamily: this._peaks.options.fontFamily,
    fontSize:   this._peaks.options.fontSize,
    fontStyle:  this._peaks.options.fontStyle
  });

  if (this._label) {
    this._label.hide();
  }

  // Create with default y and height, the real values are set in fitToView().
  const segmentStartOffset = this._view.timeToPixelOffset(this._segment.startTime);
  const segmentEndOffset   = this._view.timeToPixelOffset(this._segment.endTime);

  const overlayRectHeight = clamp(0, this._view.getHeight() - 2 * this._overlayOffset);

  this._overlay = new Konva.Group({
    name:          'overlay',
    x:             segmentStartOffset,
    y:             0,
    width:         segmentEndOffset - segmentStartOffset,
    height:        this._view.getHeight(),
    clipX:         0,
    clipY:         this._overlayOffset,
    clipWidth:     segmentEndOffset - segmentStartOffset,
    clipHeight:    overlayRectHeight,
    draggable:     this._draggable,
    dragBoundFunc: this._dragBoundFunc
  });

  let overlayBorderColor, overlayBorderWidth, overlayColor, overlayOpacity, overlayCornerRadius;

  if (segmentOptions.overlay) {
    overlayBorderColor  = this._borderColor || segmentOptions.overlayBorderColor;
    overlayBorderWidth  = segmentOptions.overlayBorderWidth;
    overlayColor        = this._color || segmentOptions.overlayColor;
    overlayOpacity      = segmentOptions.overlayOpacity;
    overlayCornerRadius = segmentOptions.overlayCornerRadius;
  }

  this._overlayRect = new Konva.Rect({
    x:            0,
    y:            this._overlayOffset,
    width:        segmentEndOffset - segmentStartOffset,
    stroke:       overlayBorderColor,
    strokeWidth:  overlayBorderWidth,
    height:       overlayRectHeight,
    fill:         overlayColor,
    opacity:      overlayOpacity,
    cornerRadius: overlayCornerRadius
  });

  this._overlay.add(this._overlayRect);

  if (segmentOptions.overlay) {
    this._overlayText = new Konva.Text({
      x:             0,
      y:             this._overlayOffset,
      text:          this._segment.labelText,
      fontFamily:    segmentOptions.overlayFontFamily,
      fontSize:      segmentOptions.overlayFontSize,
      fontStyle:     segmentOptions.overlayFontStyle,
      fill:          segmentOptions.overlayLabelColor,
      listening:     false,
      align:         segmentOptions.overlayLabelAlign,
      width:         segmentEndOffset - segmentStartOffset,
      verticalAlign: segmentOptions.overlayLabelVerticalAlign,
      height:        overlayRectHeight,
      padding:       segmentOptions.overlayLabelPadding
    });

    this._overlay.add(this._overlayText);
  }

  // Set up event handlers to show/hide the segment label text when the user
  // hovers the mouse over the segment.
  this._overlay.on('mouseenter', this._onMouseEnter);
  this._overlay.on('mouseleave', this._onMouseLeave);

  this._overlay.on('mousedown', this._onMouseDown);
  this._overlay.on('mouseup', this._onMouseUp);

  this._overlay.on('click', this._onClick);
  this._overlay.on('dblclick', this._onDblClick);
  this._overlay.on('contextmenu', this._onContextMenu);

  if (this._draggable) {
    this._overlay.on('dragstart', this._onSegmentDragStart);
    this._overlay.on('dragmove', this._onSegmentDragMove);
    this._overlay.on('dragend', this._onSegmentDragEnd);
  }

  this._createMarkers();
}

SegmentShape.prototype._dragBoundFunc = function(pos) {
  // Allow the segment to be moved horizontally but not vertically.
  return {
    x: pos.x,
    y: 0
  };
};

/**
 * Update the segment shape after the segment's attributes have changed.
 */

SegmentShape.prototype.update = function(options) {
  const segmentStartOffset = this._view.timeToPixelOffset(this._segment.startTime);
  const segmentEndOffset   = this._view.timeToPixelOffset(this._segment.endTime);
  const width = segmentEndOffset - segmentStartOffset;
  let marker;

  if ((marker = this.getStartMarker())) {
    marker.setX(segmentStartOffset - marker.getWidth());

    marker.update();

    if (options && objectHasProperty(options, 'startTime')) {
      marker.timeUpdated(options.startTime);
    }
  }

  if ((marker = this.getEndMarker())) {
    marker.setX(segmentEndOffset);

    marker.update();

    if (options && objectHasProperty(options, 'endTime')) {
      marker.timeUpdated(options.endTime);
    }
  }

  this._color = this._segment.color;
  this._borderColor = this._segment.bordercolor;

  if (this._overlayText) {
    this._overlayText.text(this._segment.labelText);
  }

  const segmentOptions = this._view.getViewOptions().segmentOptions;

  if (segmentOptions.overlay) {
    if (this._color) {
      this._overlayRect.fill(this._color);
    }

    if (this._borderColor) {
      this._overlayRect.stroke(this._borderColor);
    }
  }
  else {
    this._waveformShape.setWaveformColor(this._segment.color);
  }

  // While dragging, the overlay position is controlled in _onSegmentDragMove().

  if (!this._dragging) {
    if (this._overlay) {
      this._overlay.setAttrs({
        x:         segmentStartOffset,
        width:     width,
        clipWidth: width < 1 ? 1 : width
      });

      this._overlayRect.setAttrs({
        x:     0,
        width: width
      });

      if (this._overlayText) {
        this._overlayText.setAttrs({
          width: width
        });
      }
    }
  }
};

SegmentShape.prototype.getSegment = function() {
  return this._segment;
};

SegmentShape.prototype.getStartMarker = function() {
  return this._startMarker;
};

SegmentShape.prototype.getEndMarker = function() {
  return this._endMarker;
};

SegmentShape.prototype.addToLayer = function(layer) {
  if (this._waveformShape) {
    this._waveformShape.addToLayer(layer);
  }

  if (this._label) {
    layer.add(this._label);
  }

  if (this._overlay) {
    layer.add(this._overlay);
  }

  if (this._startMarker) {
    this._startMarker.addToLayer(layer);
  }

  if (this._endMarker) {
    this._endMarker.addToLayer(layer);
  }
};

SegmentShape.prototype.isDragging = function() {
  return this._dragging;
};

function createOverlayMarker(options) {
  return new OverlaySegmentMarker(options);
}

SegmentShape.prototype._createMarkers = function() {
  const editable = this._layer.isEditingEnabled() && this._segment.editable;

  if (!editable) {
    return;
  }

  const segmentOptions = this._view.getViewOptions().segmentOptions;

  const createSegmentMarker = segmentOptions.markers ?
    this._peaks.options.createSegmentMarker :
    createOverlayMarker;

  const startMarker = createSegmentMarker({
    segment:        this._segment,
    draggable:      editable,
    startMarker:    true,
    color:          segmentOptions.startMarkerColor,
    fontFamily:     this._peaks.options.fontFamily || defaultFontFamily,
    fontSize:       this._peaks.options.fontSize || defaultFontSize,
    fontStyle:      this._peaks.options.fontStyle || defaultFontShape,
    layer:          this._layer,
    view:           this._view.getName(),
    segmentOptions: this._view.getViewOptions().segmentOptions
  });

  if (startMarker) {
    this._startMarker = new SegmentMarker({
      segment:       this._segment,
      segmentShape:  this,
      draggable:     editable,
      startMarker:   true,
      marker:        startMarker,
      onDragStart:   this._onSegmentMarkerDragStart,
      onDragMove:    this._onSegmentMarkerDragMove,
      onDragEnd:     this._onSegmentMarkerDragEnd,
      dragBoundFunc: this._segmentMarkerDragBoundFunc
    });
  }

  const endMarker = createSegmentMarker({
    segment:        this._segment,
    draggable:      editable,
    startMarker:    false,
    color:          segmentOptions.endMarkerColor,
    fontFamily:     this._peaks.options.fontFamily || defaultFontFamily,
    fontSize:       this._peaks.options.fontSize || defaultFontSize,
    fontStyle:      this._peaks.options.fontStyle || defaultFontShape,
    layer:          this._layer,
    view:           this._view.getName(),
    segmentOptions: this._view.getViewOptions().segmentOptions
  });

  if (endMarker) {
    this._endMarker = new SegmentMarker({
      segment:       this._segment,
      segmentShape:  this,
      draggable:     editable,
      startMarker:   false,
      marker:        endMarker,
      onDragStart:   this._onSegmentMarkerDragStart,
      onDragMove:    this._onSegmentMarkerDragMove,
      onDragEnd:     this._onSegmentMarkerDragEnd,
      dragBoundFunc: this._segmentMarkerDragBoundFunc
    });
  }
};

SegmentShape.prototype._onMouseEnter = function(event) {
  if (this._label) {
    this._label.moveToTop();
    this._label.show();
  }

  this._peaks.emit('segments.mouseenter', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onMouseLeave = function(event) {
  if (this._label) {
    this._label.hide();
  }

  this._peaks.emit('segments.mouseleave', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onMouseDown = function(event) {
  this._peaks.emit('segments.mousedown', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onMouseUp = function(event) {
  this._peaks.emit('segments.mouseup', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onClick = function(event) {
  this._moveToTop();

  this._peaks.emit('segments.click', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onDblClick = function(event) {
  this._peaks.emit('segments.dblclick', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype._onContextMenu = function(event) {
  this._peaks.emit('segments.contextmenu', {
    segment: this._segment,
    evt: event.evt
  });
};

SegmentShape.prototype.enableSegmentDragging = function(enable) {
  if (!this._segment.editable) {
    return;
  }

  if (!this._draggable && enable) {
    this._overlay.on('dragstart', this._onSegmentDragStart);
    this._overlay.on('dragmove', this._onSegmentDragMove);
    this._overlay.on('dragend', this._onSegmentDragEnd);
  }
  else if (this._draggable && !enable) {
    this._overlay.off('dragstart', this._onSegmentDragStart);
    this._overlay.off('dragmove', this._onSegmentDragMove);
    this._overlay.off('dragend', this._onSegmentDragEnd);
  }

  this._overlay.draggable(enable);
  this._draggable = enable;
};

SegmentShape.prototype._setPreviousAndNextSegments = function() {
  if (this._view.getSegmentDragMode() !== 'overlap') {
    this._nextSegment = this._peaks.segments.findNextSegment(this._segment);
    this._previousSegment = this._peaks.segments.findPreviousSegment(this._segment);
  }
  else {
    this._nextSegment = null;
    this._previousSegment = null;
  }
};

SegmentShape.prototype._onSegmentDragStart = function(event) {
  this._setPreviousAndNextSegments();

  this._dragging = true;
  this._dragStartX = this._overlay.getX();
  this._dragStartTime = this._segment.startTime;
  this._dragEndTime = this._segment.endTime;

  this._peaks.emit('segments.dragstart', {
    segment: this._segment,
    marker: false,
    startMarker: false,
    evt: event.evt
  });
};

SegmentShape.prototype._onSegmentDragMove = function(event) {
  const x = this._overlay.getX();
  const offsetX = x - this._dragStartX;
  const timeOffset = this._view.pixelsToTime(offsetX);

  // The WaveformShape for a segment fills the canvas width
  // but only draws a subset of the horizontal range. When dragged
  // we need to keep the shape object in its position but
  // update the segment start and end time so that the right
  // subset is drawn.

  // Calculate new segment start/end time based on drag position. We'll
  // correct this later based on the drag mode, to prevent overlapping
  // segments or to compress the adjacent segment.

  let startTime = this._dragStartTime + timeOffset;
  let endTime = this._dragEndTime + timeOffset;
  const segmentDuration = this._segment.endTime - this._segment.startTime;
  let dragMode;
  const minSegmentWidth = this._view.getMinSegmentDragWidth();
  const minSegmentDuration = this._view.pixelsToTime(minSegmentWidth);
  let previousSegmentUpdated = false;
  let nextSegmentUpdated = false;

  // Prevent the segment from being dragged beyond the start of the waveform.

  if (startTime < 0) {
    startTime = 0;
    endTime = segmentDuration;
    this._overlay.setX(this._view.timeToPixelOffset(startTime));
  }

  // Adjust segment position if it now overlaps the previous segment?

  if (this._previousSegment) {
    let previousSegmentEndX = this._view.timeToPixelOffset(this._previousSegment.endTime);

    if (startTime < this._previousSegment.endTime) {
      dragMode = this._view.getSegmentDragMode();

      if (dragMode === 'no-overlap' ||
          (dragMode === 'compress' && !this._previousSegment.editable)) {
        startTime = this._previousSegment.endTime;
        endTime = startTime + segmentDuration;
        this._overlay.setX(previousSegmentEndX);
      }
      else if (dragMode === 'compress') {
        let previousSegmentEndTime = this._view.pixelOffsetToTime(x);
        const minPreviousSegmentEndTime = this._previousSegment.startTime + minSegmentDuration;

        if (previousSegmentEndTime < minPreviousSegmentEndTime) {
          previousSegmentEndTime = minPreviousSegmentEndTime;

          previousSegmentEndX = this._view.timeToPixelOffset(previousSegmentEndTime);

          this._overlay.setX(previousSegmentEndX);

          startTime = previousSegmentEndTime;
          endTime = startTime + segmentDuration;
        }

        this._previousSegment.update({ endTime: previousSegmentEndTime });

        previousSegmentUpdated = true;
      }
    }
  }

  // Adjust segment position if it now overlaps the following segment?

  if (this._nextSegment) {
    let nextSegmentStartX = this._view.timeToPixelOffset(this._nextSegment.startTime);

    const endX = this._overlay.getX() + this._overlay.getWidth();

    if (endTime > this._nextSegment.startTime) {
      dragMode = this._view.getSegmentDragMode();

      if (dragMode === 'no-overlap' ||
          (dragMode === 'compress' && !this._nextSegment.editable)) {
        endTime = this._nextSegment.startTime;
        startTime = endTime - segmentDuration;
        this._overlay.setX(nextSegmentStartX - this._overlay.getWidth());
      }
      else if (dragMode === 'compress') {
        let nextSegmentStartTime = this._view.pixelOffsetToTime(endX);

        const maxNextSegmentStartTime = this._nextSegment.endTime - minSegmentDuration;

        if (nextSegmentStartTime > maxNextSegmentStartTime) {
          nextSegmentStartTime = maxNextSegmentStartTime;

          nextSegmentStartX = this._view.timeToPixelOffset(nextSegmentStartTime);

          this._overlay.setX(nextSegmentStartX - this._overlay.getWidth());

          endTime = nextSegmentStartTime;
          startTime = endTime - segmentDuration;
        }

        this._nextSegment.update({ startTime: nextSegmentStartTime });

        nextSegmentUpdated = true;
      }
    }
  }

  this._segment._setStartTime(startTime);
  this._segment._setEndTime(endTime);

  this._peaks.emit('segments.dragged', {
    segment: this._segment,
    marker: false,
    startMarker: false,
    evt: event.evt
  });

  if (previousSegmentUpdated) {
    this._peaks.emit('segments.dragged', {
      segment: this._previousSegment,
      marker: false,
      startMarker: false,
      evt: event.evt
    });
  }
  else if (nextSegmentUpdated) {
    this._peaks.emit('segments.dragged', {
      segment: this._nextSegment,
      marker: false,
      startMarker: false,
      evt: event.evt
    });
  }
};

SegmentShape.prototype._onSegmentDragEnd = function(event) {
  this._dragging = false;

  this._peaks.emit('segments.dragend', {
    segment: this._segment,
    marker: false,
    startMarker: false,
    evt: event.evt
  });
};

SegmentShape.prototype._moveToTop = function() {
  this._overlay.moveToTop();

  if (this._endMarker) {
    this._endMarker.moveToTop();
  }

  if (this._startMarker) {
    this._startMarker.moveToTop();
  }
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentMarkerDragStart = function(segmentMarker, event) {
  this._setPreviousAndNextSegments();

  // Move this segment to the top of the z-order, so that it remains on top
  // of any adjacent segments that the marker is dragged over.
  this._moveToTop();

  this._startMarkerX = this._startMarker.getX();
  this._endMarkerX = this._endMarker.getX();

  this._peaks.emit('segments.dragstart', {
    segment: this._segment,
    marker: true,
    startMarker: segmentMarker.isStartMarker(),
    evt: event.evt
  });
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentMarkerDragMove = function(segmentMarker, event) {
  if (segmentMarker.isStartMarker()) {
    this._segmentStartMarkerDragMove(segmentMarker, event);
    segmentMarker.timeUpdated(segmentMarker.getSegment().startTime);
  }
  else {
    this._segmentEndMarkerDragMove(segmentMarker, event);
    segmentMarker.timeUpdated(segmentMarker.getSegment().endTime);
  }

  segmentMarker.update();
};

SegmentShape.prototype._segmentStartMarkerDragMove = function(segmentMarker, event) {
  const startMarkerX = this._startMarker.getX();
  const endMarkerX   = this._endMarker.getX();

  let minSegmentDuration = this._view.pixelsToTime(50);
  const minSegmentWidth = this._view.getMinSegmentDragWidth();

  const upperLimit = this._endMarker.getX() - minSegmentWidth;
  let lowerLimit;
  let previousSegmentVisible = true;
  let previousSegmentUpdated = false;

  if (this._previousSegment) {
    const dragMode = this._view.getSegmentDragMode();

    if (dragMode === 'no-overlap' ||
        (dragMode === 'compress' && !this._previousSegment.editable)) {
      lowerLimit = this._view.timeToPixelOffset(this._previousSegment.endTime);

      if (lowerLimit < 0) {
        lowerLimit = 0;
        previousSegmentVisible = false;
      }
    }
    else if (dragMode === 'compress') {
      const segmentDuration = this._previousSegment.endTime - this._previousSegment.startTime;

      if (segmentDuration < minSegmentDuration) {
        minSegmentDuration = segmentDuration;
      }

      lowerLimit = this._view.timeToPixelOffset(
        this._previousSegment.startTime + minSegmentDuration
      );

      if (lowerLimit < 0) {
        lowerLimit = 0;
        previousSegmentVisible = false;
      }
    }
  }
  else {
    lowerLimit = 0;
  }

  if (startMarkerX >= lowerLimit && startMarkerX < upperLimit) {
    this._overlay.clipWidth(endMarkerX - startMarkerX);

    segmentMarker.setX(startMarkerX);

    this._segment._setStartTime(this._view.pixelOffsetToTime(startMarkerX));

    segmentMarker.timeUpdated(this._segment.startTime);

    if (this._previousSegment) {
      const prevSegmentEndX = this._view.timeToPixelOffset(this._previousSegment.endTime);

      if (startMarkerX < prevSegmentEndX) {
        this._previousSegment.update({
          endTime: this._view.pixelOffsetToTime(startMarkerX)
        });

        previousSegmentUpdated = true;
      }
    }
  }
  else {
    const x = startMarkerX >= upperLimit ? upperLimit : lowerLimit;

    this._overlay.clipWidth(endMarkerX - x);

    segmentMarker.setX(x);

    if (this._previousSegment && previousSegmentVisible && startMarkerX < lowerLimit) {
      this._segment._setStartTime(this._previousSegment.endTime);
    }
    else {
      this._segment._setStartTime(this._view.pixelOffsetToTime(x));
    }

    segmentMarker.timeUpdated(this._segment.startTime);
  }

  this._peaks.emit('segments.dragged', {
    segment: this._segment,
    marker: true,
    startMarker: true,
    evt: event.evt
  });

  if (previousSegmentUpdated) {
    this._peaks.emit('segments.dragged', {
      segment: this._previousSegment,
      marker: true,
      startMarker: false,
      evt: event.evt
    });
  }
};

SegmentShape.prototype._segmentEndMarkerDragMove = function(segmentMarker, event) {
  const startMarkerX = this._startMarker.getX();
  const endMarkerX   = this._endMarker.getX();

  let minSegmentDuration = this._view.pixelsToTime(50);
  const minSegmentWidth = this._view.getMinSegmentDragWidth();

  const lowerLimit = this._startMarker.getX() + minSegmentWidth;
  let upperLimit;
  let nextSegmentVisible = true;
  let nextSegmentUpdated = false;

  const width = this._view.getWidth();

  if (this._nextSegment) {
    const dragMode = this._view.getSegmentDragMode();

    if (dragMode === 'no-overlap' ||
        (dragMode === 'compress' && !this._nextSegment.editable)) {
      upperLimit = this._view.timeToPixelOffset(this._nextSegment.startTime);

      if (upperLimit > width) {
        upperLimit = width;
        nextSegmentVisible = false;
      }
    }
    else if (dragMode === 'compress') {
      const segmentDuration = this._nextSegment.endTime - this._nextSegment.startTime;

      if (segmentDuration < minSegmentDuration) {
        minSegmentDuration = segmentDuration;
      }

      upperLimit = this._view.timeToPixelOffset(this._nextSegment.endTime - minSegmentDuration);

      if (upperLimit > width) {
        upperLimit = width;
        nextSegmentVisible = false;
      }
    }
  }
  else {
    upperLimit = width;
  }

  if (endMarkerX >= lowerLimit && endMarkerX < upperLimit) {
    this._overlay.clipWidth(endMarkerX - startMarkerX);

    segmentMarker.setX(endMarkerX);

    this._segment._setEndTime(this._view.pixelOffsetToTime(endMarkerX));

    segmentMarker.timeUpdated(this._segment.endTime);

    if (this._nextSegment) {
      const nextSegmentStartX = this._view.timeToPixelOffset(this._nextSegment.startTime);

      if (endMarkerX > nextSegmentStartX) {
        this._nextSegment.update({
          startTime: this._view.pixelOffsetToTime(endMarkerX)
        });

        nextSegmentUpdated = true;
      }
    }
  }
  else {
    const x = endMarkerX >= upperLimit ? upperLimit : lowerLimit;

    this._overlay.clipWidth(x - startMarkerX);

    segmentMarker.setX(x);

    if (this._nextSegment && nextSegmentVisible && endMarkerX >= upperLimit) {
      this._segment._setEndTime(this._nextSegment.startTime);
    }
    else {
      this._segment._setEndTime(this._view.pixelOffsetToTime(x));
    }

    segmentMarker.timeUpdated(this._segment.endTime);
  }

  this._peaks.emit('segments.dragged', {
    segment: this._segment,
    marker: true,
    startMarker: false,
    evt: event.evt
  });

  if (nextSegmentUpdated) {
    this._peaks.emit('segments.dragged', {
      segment: this._nextSegment,
      marker: true,
      startMarker: true,
      evt: event.evt
    });
  }
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentMarkerDragEnd = function(segmentMarker, event) {
  this._nextSegment = null;
  this._previousSegment = null;

  const startMarker = segmentMarker.isStartMarker();

  this._peaks.emit('segments.dragend', {
    segment: this._segment,
    marker: true,
    startMarker: startMarker,
    evt: event.evt
  });
};

// eslint-disable-next-line no-unused-vars
SegmentShape.prototype._segmentMarkerDragBoundFunc = function(segmentMarker, pos) {
  // Allow the marker to be moved horizontally but not vertically.
  return {
    x: pos.x,
    y: segmentMarker.getAbsolutePosition().y
  };
};

SegmentShape.prototype.fitToView = function() {
  if (this._startMarker) {
    this._startMarker.fitToView();
  }

  if (this._endMarker) {
    this._endMarker.fitToView();
  }

  if (this._overlay) {
    const height = this._view.getHeight();

    const overlayRectHeight = clamp(0, height - (this._overlayOffset * 2));

    this._overlay.setAttrs({
      y:          0,
      height:     height,
      clipY:      this._overlayOffset,
      clipHeight: overlayRectHeight
    });

    this._overlayRect.setAttrs({
      y:      this._overlayOffset,
      height: overlayRectHeight
    });

    if (this._overlayText) {
      this._overlayText.setAttrs({
        y:      this._overlayOffset,
        height: overlayRectHeight
      });
    }
  }
};

SegmentShape.prototype.destroy = function() {
  if (this._waveformShape) {
    this._waveformShape.destroy();
  }

  if (this._label) {
    this._label.destroy();
  }

  if (this._startMarker) {
    this._startMarker.destroy();
  }

  if (this._endMarker) {
    this._endMarker.destroy();
  }

  if (this._overlay) {
    this._overlay.destroy();
  }
};

export default SegmentShape;
