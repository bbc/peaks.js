/**
 * @file
 *
 * Defines the {@link InputController} class.
 *
 * @module input-controller
 */

function InputController(containerId) {
  const element = document.getElementById(containerId);
  const canvases = element.getElementsByTagName('canvas');
  const rect = element.getBoundingClientRect();

  this._target = canvases.length > 1 ? canvases[4] : canvases[0];
  this._top = rect.top;
  this._left = rect.left;
}

InputController.prototype.mouseDown = function(pos) {
  this._dispatchMouseEvent('mousedown', pos);
};

InputController.prototype.mouseMove = function(pos) {
  this._dispatchMouseEvent('mousemove', pos);
};

InputController.prototype.mouseUp = function(pos) {
  this._dispatchMouseEvent('mouseup', pos);
};

InputController.prototype._dispatchMouseEvent = function(type, pos) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: this._left + pos.x,
    clientY: this._top  + pos.y
  });

  this._target.dispatchEvent(event);
};

const keyCodes = {
  Tab: 9,
  Space: 32,
  ArrowLeft: 37,
  ArrowRight: 39
};

InputController.prototype.keyDown = function(key, shift) {
  this._dispatchKeyboardEvent('keydown', key, shift);
};

InputController.prototype.keyUp = function(key, shift) {
  this._dispatchKeyboardEvent('keyup', key, shift);
};

InputController.prototype._dispatchKeyboardEvent = function(type, key, shift) {
  const event = new KeyboardEvent(type, {
    bubbles:  true,
    keyCode:  keyCodes[key],
    shiftKey: shift
  });

  this._target.dispatchEvent(event);
};

module.exports = InputController;
