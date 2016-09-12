/**
 * @file
 *
 * Defines the {@link KeyboardHandler} class.
 *
 * @module peaks/player/player.keyboard
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

    document.addEventListener('keydown', this.handleKeyEvent.bind(this));
    document.addEventListener('keypress', this.handleKeyEvent.bind(this));
    document.addEventListener('keyup', this.handleKeyEvent.bind(this));
  }

  /**
   * Keyboard event handler function.
   *
   * @note Arrow keys only triggered on keydown, not keypress
   *
   * @param {KeyboardEvent} event
   * @private
   */
  KeyboardHandler.prototype.handleKeyEvent = function handleKeyEvent(event) {
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

  return KeyboardHandler;
});
