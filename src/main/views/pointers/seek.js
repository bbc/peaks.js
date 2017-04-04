/**
 * @file
 *
 * Mouse drag handler for non-scrollable waveform views.
 *
 * @module peaks/views/pointers/seek
 */
 define(['peaks/views/helpers/mousedraghandler'], function(MouseDragHandler) {
  'use strict';

  return {

    /**
     * Creates a {@link MouseDragHandler} object for use with a non-scrollabel
     * waveform view.
     *
     * @param {WaveformView} view
     * @returns {MouseDragHandler}
     */
    create: function(view) {
      return new MouseDragHandler(view.stage, {
        onMouseDown: function(mousePosX) {
          view.emit('user_seek', view.data.time(mousePosX));
        },

        onMouseMove: function(mousePosX) {
          if (mousePosX < 0) {
            mousePosX = 0;
          }
          else if (mousePosX > view.width) {
            mousePosX = view.width;
          }

          view.emit('user_seek', view.data.time(mousePosX));
        }
      });
    }
  };
});
