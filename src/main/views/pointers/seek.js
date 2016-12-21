'use strict';

define(['peaks/views/helpers/mousedraghandler'], function(MouseDragHandler) {
  return function(view) {
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
  };
});
