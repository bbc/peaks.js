/**
 * @file
 *
 * Defines the {@link MouseDragHandler} class.
 *
 * @module peaks/views/helpers/mousedraghandler
 */
define(function() {
  'use strict';

  /**
   * An object to receive callbacks on mouse drag events. Easch function is
   * called with the current mouse X position, relative to the stage.
   *
   * @typedef {Object} MouseDragHandlers
   * @global
   * @property {Function} onMouseDown Mouse down event handler.
   * @property {Function} onMouseMove Mouse move event handler.
   * @property {Function} onMouseUp Mouse up event handler.
   */

  /**
   * Creates a handler for mouse events to allow interaction with the waveform
   * views by clicking and dragging the mouse.
   *
   * @class
   * @alias MouseDragHandler
   *
   * @param {Konva.Stage} stage
   * @param {MouseDragHandlers} handlers
   */

  function MouseDragHandler(stage, handlers) {
    this._stage     = stage;
    this._handlers  = handlers;
    this._dragging  = false;
    this._mouseDown = this.mouseDown.bind(this);
    this._mouseUp   = this.mouseUp.bind(this);
    this._mouseMove = this.mouseMove.bind(this);

    this._stage.on('mousedown', this._mouseDown);

    this._mouseDownClientX = null;
    this._mouseDownLayerX  = null;
    this._mousePosLayerX   = null;
  }

  /**
   * Mouse down event handler.
   *
   * @param {MouseEvent} event
   */

  MouseDragHandler.prototype.mouseDown = function(event) {
    if (!event.target) {
      return;
    }

    if (event.target.attrs.draggable ||
        event.target.parent.attrs.draggable) {
      return;
    }

    this._mouseDownClientX = event.evt.clientX;
    this._mouseDownLayerX  = event.evt.layerX;

    if (this._handlers.onMouseDown) {
      this._handlers.onMouseDown(this._mouseDownLayerX);
    }

    // Use the window mousemove and mouseup handlers instead of the
    // Konva.Stage so that we still receive events of the user moves the
    // mouse outside the stage.
    window.addEventListener('mousemove', this._mouseMove, false);
    window.addEventListener('mouseup', this._mouseUp, false);
    window.addEventListener('blur', this._mouseUp, false);
  };

  /**
   * Mouse move event handler.
   *
   * @param {MouseEvent} event
   */

  MouseDragHandler.prototype.mouseMove = function(event) {
    // Don't update on vertical mouse movement.
    if (event.clientX === this._mouseDownClientX) {
      return;
    }

    this._dragging = true;

    if (this._handlers.onMouseMove) {
      var layerX = this._getMousePosX(event);

      this._handlers.onMouseMove(layerX);
    }
  };

  /**
   * Mouse up event handler.
   *
   * @param {MouseEvent} event
   */

  MouseDragHandler.prototype.mouseUp = function(event) {
    if (this._handlers.onMouseUp) {
      var layerX = this._getMousePosX(event);

      this._handlers.onMouseUp(layerX);
    }

    window.removeEventListener('mousemove', this._mouseMove, false);
    window.removeEventListener('mouseup', this._mouseUp, false);
    window.removeEventListener('blur', this._mouseUp, false);

    this._dragging = false;
  };

  /**
   * @returns {Number} The mouse X position for a given mouse event, relative
   * to the layer that received the mouse down event.
   *
   * @param {MouseEvent} event
   * @private
   */

  MouseDragHandler.prototype._getMousePosX = function(event) {
    return event.clientX - this._mouseDownClientX + this._mouseDownLayerX;
  };

  /**
   * @returns {Boolean} <code>true</code> if the mouse is being dragged,
   * i.e., moved with the mouse button held down.
   */

  MouseDragHandler.prototype.isDragging = function() {
    return this._dragging;
  };

  return MouseDragHandler;
});
