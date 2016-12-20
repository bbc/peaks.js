/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module peaks/views/zooms/static
 */
define([], function() {
  'use strict';

  return {
    create: function(currentScale, previousScale, view) {
      return {
        start: function() {
          return true;
        }
      };
    }
  };
});
