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

  this._target = canvases[4];
  this._top = rect.top;
  this._left = rect.left;
}

InputController.prototype.mouseDown = function(pos) {
  this._dispatchEvent('mousedown', pos);
};

InputController.prototype.mouseMove = function(pos) {
  this._dispatchEvent('mousemove', pos);
};

InputController.prototype.mouseUp = function(pos) {
  this._dispatchEvent('mouseup', pos);
};

InputController.prototype._dispatchEvent = function(type, pos) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: this._left + pos.x,
    clientY: this._top  + pos.y
  });

  this._target.dispatchEvent(event);
};

module.exports = InputController;
