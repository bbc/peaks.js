'use strict';

define(['peaks/views/helpers/mousedraghandler'], function(MouseDragHandler) {
  return function(view) {
    return new MouseDragHandler(view.stage, {
      onMouseDown: function(layerX) {
        this.initialFrameOffset = view.frameOffset;
        this.mouseDownLayerX = layerX;
      },

      onMouseMove: function(layerX) {
        // Moving the mouse to the left increases the time position of the
        // left-hand edge of the visible waveform.
        var diff = this.mouseDownLayerX - layerX;

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

      onMouseUp: function(layerX) {
        // Set playhead position only on click release, when not dragging
        if (!view.mouseDragHandler.isDragging()) {
          var pos = view.frameOffset + this.mouseDownLayerX;

          view.emit('user_seek', view.data.time(pos), pos);
        }
      }
    });
  };
});
