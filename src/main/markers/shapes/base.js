/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define(function () {
  'use strict';

  function BaseShape(){}

  function noop(){}

  function throwUndefined(){
    throw new Error('You should extend this method in your parent class.');
  }

  BaseShape.prototype = {
    createShape: throwUndefined,
    update: noop
  };

  return BaseShape;
});
