/**
 * @file
 *
 * Imports the Konva modules used by Peaks.js. This reduces the size of the
 * bundled peaks.js file compared to importing all of Konva.
 *
 * @module peaks/waveform/konva
 */

/* eslint-disable no-unused-vars */
define([
  'konva/lib/Animation',
  'konva/lib/FastLayer',
  'konva/lib/Global',
  'konva/lib/Group',
  'konva/lib/Layer',
  'konva/lib/Shape',
  'konva/lib/Stage',
  'konva/lib/shapes/Line',
  'konva/lib/shapes/Text',
  'konva/lib/shapes/Rect'
  ], function(
    Animation,
    FastLayer,
    Global,
    Group,
    Layer,
    Shape,
    Stage,
    Line,
    Text,
    Rect) {
  'use strict';

  // The Global.Konva object contains only the sub-modules listed above.
  return Global.Konva;
});
