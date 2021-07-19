/**
 * @file
 *
 * Defines the {@link PointMarker} class.
 *
 * @module point-marker
 */

import { Group } from 'konva/lib/Group';

/**
 * Parameters for the {@link PointMarker} constructor.
 *
 * @typedef {Object} PointMarkerOptions
 * @global
 * @property {Point} point Point object with timestamp.
 * @property {Boolean} draggable If true, marker is draggable.
 * @property {Marker} marker
 * @property {Function} onDblClick
 * @property {Function} onDragStart
 * @property {Function} onDragMove Callback during mouse drag operations.
 * @property {Function} onDragEnd
 * @property {Function} onMouseEnter
 * @property {Function} onMouseLeave
 */

/**
 * Creates a point marker handle.
 *
 * @class
 * @alias PointMarker
 *
 * @param {PointMarkerOptions} options
 */

export default class PointMarker {
  constructor(options) {
    this._point     = options.point;
    this._marker    = options.marker;
    this._draggable = options.draggable;

    this._onDblClick   = options.onDblClick;
    this._onDragStart  = options.onDragStart;
    this._onDragMove   = options.onDragMove;
    this._onDragEnd    = options.onDragEnd;
    this._onMouseEnter = options.onMouseEnter;
    this._onMouseLeave = options.onMouseLeave;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._group = new Group({
      draggable:     this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    this._bindDefaultEventHandlers();

    this._marker.init(this._group);
  }

  _bindDefaultEventHandlers() {
    this._group.on('dragstart', () => this._onDragStart(this._point));
    this._group.on('dragmove', () => this._onDragMove(this._point));
    this._group.on('dragend', () => this._onDragEnd(this._point));
    this._group.on('dblclick', () => this._onDblClick(this._point));
    this._group.on('mouseenter', () => this._onMouseEnter(this._point));
    this._group.on('mouseleave', () => this._onMouseLeave(this._point));
  }

  _dragBoundFunc(pos) {
    // Allow the marker to be moved horizontally but not vertically.
    return {
      x: pos.x,
      y: this._group.getAbsolutePosition().y
    };
  }

  /**
   * @param {Konva.Layer} layer
   */

  addToLayer(layer) {
    layer.add(this._group);
  }

  fitToView() {
    this._marker.fitToView();
  }

  getPoint() {
    return this._point;
  }

  getX() {
    return this._group.getX();
  }

  getWidth() {
    return this._group.getWidth();
  }

  setX(x) {
    this._group.setX(x);
  }

  timeUpdated(time) {
    if (this._marker.timeUpdated) {
      this._marker.timeUpdated(time);
    }
  }

  destroy() {
    if (this._marker.destroy) {
      this._marker.destroy();
    }

    this._group.destroyChildren();
    this._group.destroy();
  }
}
