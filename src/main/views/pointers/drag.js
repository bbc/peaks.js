'use strict';

define(['peaks/views/helpers/mousedraghandler'], function(MouseDragHandler) {
  'use strict';

  return {

    /**
     * Creates a {@link MouseDragHandler} object for use with a scrollable
     * waveform view.
     *
     * @param {WaveformView} view
     * @returns {MouseDragHandler}
     */
    create: function(view) {
      return new MouseDragHandler(view.stage, {
        onMouseDown: function(mousePosX) {
          this.initialFrameOffset = view.frameOffset;
          this.mouseDownX = mousePosX;
        },

        onMouseMove: function(mousePosX) {
          // Moving the mouse to the left increases the time position of the
          // left-hand edge of the visible waveform.
          var diff = this.mouseDownX - mousePosX;

          var newFrameOffset = this.initialFrameOffset + diff;

          if (newFrameOffset < 0) {
            newFrameOffset = 0;
          }
          else if (newFrameOffset > (view.pixelLength - view.width)) {
            newFrameOffset = view.pixelLength - view.width;
          }

          if (newFrameOffset !== this.initialFrameOffset) {
            view.emit('user_scroll', newFrameOffset);
          }
        },

        onMouseUp: function(mousePosX, isDragging) {
          // Set playhead position only on click release, when not dragging
          if (!isDragging) {
            var pos = view.frameOffset + this.mouseDownX;

            view.emit('user_seek', view.data.time(pos), pos);
          }
        }
      });
    }
  };
});
