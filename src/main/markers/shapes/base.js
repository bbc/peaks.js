/**
 * @file
 *
 * Defines the {@link BaseShape} class.
 *
 * @module peaks/markers/shapes/base
 */
define(function() {
  'use strict';

  /**
   * @class
   * @alias BaseShape
   */
  function BaseShape() {}

  function noop() {}

  function throwUndefined() {
    throw new Error('You should extend this method in your parent class.');
  }

  BaseShape.prototype = {
    createShape: throwUndefined,
    update: noop
  };

  return BaseShape;
});
