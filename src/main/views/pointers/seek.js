'use strict';

define(['peaks/views/helpers/mousedraghandler'], function(MouseDragHandler) {
  return function(view) {
    return new MouseDragHandler(view.stage, {
      onMouseDown: function(layerX) {
        view.emit('user_seek', view.data.time(layerX));
      },

      onMouseMove: function(layerX) {
        if (layerX < 0) {
          layerX = 0;
        }
        else if (layerX > view.width) {
          layerX = view.width;
        }

        view.emit('user_seek', view.data.time(layerX));
      }
    });
  };
});
