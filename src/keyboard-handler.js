/**
 * @file
 *
 * Defines the {@link KeyboardHandler} class.
 *
 * @module keyboard-handler
 */

define([], function() {
  'use strict';

  var nodes = ['OBJECT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'];

  var SPACE = 32,
      TAB = 9,
      LEFT_ARROW = 37,
      RIGHT_ARROW = 39;

  var keys = [SPACE, TAB, LEFT_ARROW, RIGHT_ARROW];

  /**
   * Configures keyboard event handling.
   *
   * @class
   * @alias KeyboardHandler
   *
   * @param {EventEmitter} eventEmitter
   */

  function KeyboardHandler(eventEmitter) {
    this.eventEmitter = eventEmitter;

    this._handleKeyEvent = this._handleKeyEvent.bind(this);

    document.addEventListener('keydown', this._handleKeyEvent);
    document.addEventListener('keypress', this._handleKeyEvent);
    document.addEventListener('keyup', this._handleKeyEvent);
  }

  /**
   * Keyboard event handler function.
   *
   * @note Arrow keys only triggered on keydown, not keypress.
   *
   * @param {KeyboardEvent} event
   * @private
   */

  KeyboardHandler.prototype._handleKeyEvent = function handleKeyEvent(event) {
    if (nodes.indexOf(event.target.nodeName) === -1) {
      if (keys.indexOf(event.type) > -1) {
        event.preventDefault();
      }

      if (event.type === 'keydown' || event.type === 'keypress') {
        switch (event.keyCode) {
          case SPACE:
            this.eventEmitter.emit('keyboard.space');
            break;

          case TAB:
            this.eventEmitter.emit('keyboard.tab');
            break;
        }
      }
      else if (event.type === 'keyup') {
        switch (event.keyCode) {
          case LEFT_ARROW:
            if (event.shiftKey) {
              this.eventEmitter.emit('keyboard.shift_left');
            }
            else {
              this.eventEmitter.emit('keyboard.left');
            }
            break;

          case RIGHT_ARROW:
            if (event.shiftKey) {
              this.eventEmitter.emit('keyboard.shift_right');
            }
            else {
              this.eventEmitter.emit('keyboard.right');
            }
            break;
        }
      }
    }
  };

  KeyboardHandler.prototype.destroy = function() {
    document.removeEventListener('keydown', this._handleKeyEvent);
    document.removeEventListener('keypress', this._handleKeyEvent);
    document.removeEventListener('keyup', this._handleKeyEvent);
  };

  return KeyboardHandler;
});
