/**
 * @file
 *
 * Defines the {@link SegmentShape} class.
 *
 * @module segment-shape
 */

import SegmentMarker from './segment-marker';
import WaveformShape from './waveform-shape';

var defaultFontFamily = 'sans-serif';
var defaultFontSize = 10;
var defaultFontShape = 'normal';

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
  this._segment       = segment;
  this._peaks         = peaks;
  this._layer         = layer;
  this._view          = view;
  this._label         = null;
  this._startMarker   = null;
  this._endMarker     = null;
  this._color         = segment.color;
  this._draggable     = false;

  this._waveformShape = new WaveformShape({
    color:   segment.color,
    view:    view,
    segment: segment
  });

  this._onMouseEnter  = this._onMouseEnter.bind(this);
  this._onMouseLeave  = this._onMouseLeave.bind(this);
  this._onClick       = this._onClick.bind(this);
  this._onDblClick    = this._onDblClick.bind(this);
  this._onContextMenu = this._onContextMenu.bind(this);

  // Set up event handlers to show/hide the segment label text when the user
  // hovers the mouse over the segment.
  this._waveformShape.on('mouseenter', this._onMouseEnter);
  this._waveformShape.on('mouseleave', this._onMouseLeave);
  this._waveformShape.on('click', this._onClick);
  this._waveformShape.on('dblclick', this._onDblClick);
  this._waveformShape.on('contextmenu', this._onContextMenu);

  this._onSegmentDragStart = this._onSegmentDragStart.bind(this);
  this._onSegmentDrag = this._onSegmentDrag.bind(this);

  if (this._segment.editable && this._view._isSegmentDraggingEnabled()) {
    this._waveformShape.on('dragmove', this._onSegmentDrag);
    this._waveformShape.on('dragstart', this._onSegmentDragStart);
    this._draggable = true;
  }

  // Event handlers for markers
  this._onSegmentHandleDrag      = this._onSegmentHandleDrag.bind(this);
  this._onSegmentHandleDragStart = this._onSegmentHandleDragStart.bind(this);
  this._onSegmentHandleDragEnd   = this._onSegmentHandleDragEnd.bind(this);

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

  this._createMarkers();
}

SegmentShape.prototype.updatePosition = function() {
  var segmentStartOffset = this._view.timeToPixels(this._segment.startTime);
  var segmentEndOffset   = this._view.timeToPixels(this._segment.endTime);

  var frameStartOffset = this._view.getFrameOffset();

  var startPixel = segmentStartOffset - frameStartOffset;
  var endPixel   = segmentEndOffset   - frameStartOffset;

  var marker = this.getStartMarker();

  if (marker) {
    marker.setX(startPixel - marker.getWidth());
  }

  marker = this.getEndMarker();

  if (marker) {
    marker.setX(endPixel);
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
  this._waveformShape.addToLayer(layer);

  if (this._label) {
    layer.add(this._label);
  }

  if (this._startMarker) {
    this._startMarker.addToLayer(layer);
  }

  if (this._endMarker) {
    this._endMarker.addToLayer(layer);
  }
};

SegmentShape.prototype._createMarkers = function() {
  var editable = this._layer.isEditingEnabled() && this._segment.editable;

  if (!editable) {
    return;
  }

  var startMarker = this._peaks.options.createSegmentMarker({
    segment:      this._segment,
    draggable:    editable,
    startMarker:  true,
    color:        this._peaks.options.segmentStartMarkerColor,
    fontFamily:   this._peaks.options.fontFamily || defaultFontFamily,
    fontSize:     this._peaks.options.fontSize || defaultFontSize,
    fontStyle:    this._peaks.options.fontStyle || defaultFontShape,
    layer:        this._layer,
    view:         this._view.getName()
  });

  if (startMarker) {
    this._startMarker = new SegmentMarker({
      segment:      this._segment,
      segmentShape: this,
      draggable:    editable,
      startMarker:  true,
      marker:       startMarker,
      onDrag:       this._onSegmentHandleDrag,
      onDragStart:  this._onSegmentHandleDragStart,
      onDragEnd:    this._onSegmentHandleDragEnd
    });
  }

  var endMarker = this._peaks.options.createSegmentMarker({
    segment:      this._segment,
    draggable:    editable,
    startMarker:  false,
    color:        this._peaks.options.segmentEndMarkerColor,
    fontFamily:   this._peaks.options.fontFamily || defaultFontFamily,
    fontSize:     this._peaks.options.fontSize || defaultFontSize,
    fontStyle:    this._peaks.options.fontStyle || defaultFontShape,
    layer:        this._layer,
    view:         this._view.getName()
  });

  if (endMarker) {
    this._endMarker = new SegmentMarker({
      segment:      this._segment,
      segmentShape: this,
      draggable:    editable,
      startMarker:  false,
      marker:       endMarker,
      onDrag:       this._onSegmentHandleDrag,
      onDragStart:  this._onSegmentHandleDragStart,
      onDragEnd:    this._onSegmentHandleDragEnd
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

SegmentShape.prototype._onClick = function(event) {
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
  if (!this._draggable && enable) {
    this._waveformShape.on('dragmove', this._onSegmentDrag);
    this._waveformShape.on('dragstart', this._onSegmentDragStart);
  }
  else if (this._draggable && !enable) {
    this._waveformShape.off('dragmove', this._onSegmentDrag);
    this._waveformShape.off('dragstart', this._onSegmentDragStart);
  }

  this._waveformShape.enableSegmentDragging(enable);

  this._draggable = enable;
};

SegmentShape.prototype._onSegmentDragStart = function() {
  this._dragStartX = 0; // this._waveformShape.getX();
  this._dragStartTime = this._segment.startTime;
  this._dragEndTime = this._segment.endTime;
};

SegmentShape.prototype._onSegmentDrag = function(event) {
  const x = this._waveformShape.getX();
  const offsetX = x - this._dragStartX;

  // Prevent the segment from jumping randomly. Not sure
  // what causes this.
  if (offsetX !== 0) {
    var timeOffset = this._view.pixelsToTime(offsetX);

    // The WaveformShape for a segment fills the canvas width
    // but only draws a subset of the horizontal range. When dragged
    // we need to keep the shape object in its position but
    // update the segment start and end time so that the right
    // subset is drawn.
    this._segment._setStartTime(this._dragStartTime + timeOffset);
    this._segment._setEndTime(this._dragEndTime + timeOffset);
    this._waveformShape.setX(0);

    this._peaks.emit('segments.dragged', {
      segment: this._segment,
      startMarker: false,
      evt: event.evt
    });
  }
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentHandleDrag = function(event, segmentMarker) {
  var width = this._view.getWidth();

  var startMarker = segmentMarker.isStartMarker();

  var startMarkerX = this._startMarker.getX();
  var endMarkerX = this._endMarker.getX();

  if (startMarker && startMarkerX >= 0) {
    var startMarkerOffset = startMarkerX +
                            this._startMarker.getWidth();

    this._segment._setStartTime(this._view.pixelOffsetToTime(startMarkerOffset));

    segmentMarker.timeUpdated(this._segment.startTime);
  }

  if (!startMarker && endMarkerX < width) {
    var endMarkerOffset = endMarkerX;

    this._segment._setEndTime(this._view.pixelOffsetToTime(endMarkerOffset));

    segmentMarker.timeUpdated(this._segment.endTime);
  }

  this._peaks.emit('segments.dragged', {
    segment: this._segment,
    startMarker: startMarker,
    evt: event.evt
  });
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentHandleDragStart = function(event, segmentMarker) {
  var startMarker = segmentMarker.isStartMarker();

  this._peaks.emit('segments.dragstart', {
    segment: this._segment,
    startMarker: startMarker,
    evt: event.evt
  });
};

/**
 * @param {SegmentMarker} segmentMarker
 */

SegmentShape.prototype._onSegmentHandleDragEnd = function(event, segmentMarker) {
  var startMarker = segmentMarker.isStartMarker();

  this._peaks.emit('segments.dragend', {
    segment: this._segment,
    startMarker: startMarker,
    evt: event.evt
  });
};

SegmentShape.prototype.fitToView = function() {
  if (this._startMarker) {
    this._startMarker.fitToView();
  }

  if (this._endMarker) {
    this._endMarker.fitToView();
  }

  this._waveformShape.setWaveformColor(this._color);
};

SegmentShape.prototype.destroy = function() {
  this._waveformShape.destroy();

  if (this._label) {
    this._label.destroy();
  }

  if (this._startMarker) {
    this._startMarker.destroy();
  }

  if (this._endMarker) {
    this._endMarker.destroy();
  }
};

export default SegmentShape;
