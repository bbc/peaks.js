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
   * An object to receive callbacks on mouse drag events. Each function is
   * called with the current mouse X position, relative to the stage's
   * container HTML element.
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

    if (this._handlers.onMouseDown) {
      var mouseDownPosX = this._getMousePosX(this._mouseDownClientX);

      this._handlers.onMouseDown(mouseDownPosX);
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
    var clientX = event.clientX;

    // Don't update on vertical mouse movement.
    if (clientX === this._mouseDownClientX) {
      return;
    }

    this._dragging = true;

    if (this._handlers.onMouseMove) {
      var mousePosX = this._getMousePosX(clientX);

      this._handlers.onMouseMove(mousePosX);
    }
  };

  /**
   * Mouse up event handler.
   *
   * @param {MouseEvent} event
   */

  MouseDragHandler.prototype.mouseUp = function(event) {
    if (this._handlers.onMouseUp) {
      var mousePosX = this._getMousePosX(event.clientX);

      this._handlers.onMouseUp(mousePosX);
    }

    window.removeEventListener('mousemove', this._mouseMove, false);
    window.removeEventListener('mouseup', this._mouseUp, false);
    window.removeEventListener('blur', this._mouseUp, false);

    this._dragging = false;
  };

  /**
   * @returns {Number} The mouse X position, relative to the container that
   * received the mouse down event.
   *
   * @param {Number} clientX mouse client X position
   * @private
   */

  MouseDragHandler.prototype._getMousePosX = function(clientX) {
    var containerPos = this._stage.getContainer().getBoundingClientRect();

    return clientX - containerPos.left;
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
