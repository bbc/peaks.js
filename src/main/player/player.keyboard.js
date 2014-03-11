define([], function () {
  'use strict';

  var SPACE = 32,
    TAB = 9,
    LEFT_ARROW = 37,
    RIGHT_ARROW = 39;

  function handleKeyEventGenerator(peaksInstance) {
    /**
     * Arrow keys only triggered on keydown, not keypress
     */
    return function handleKeyEvent(event){
      var c = event.keyCode;
      var t = event.type;

      if (['OBJECT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'].indexOf(event.target.nodeName) === -1) {

        if ([SPACE, TAB, LEFT_ARROW, RIGHT_ARROW].indexOf(event.type) > -1) {
          event.preventDefault();
        }

        if (t === "keydown" || t === "keypress") {

          switch (c) {
            case SPACE:
              peaksInstance.emit("kybrd_space");
              break;

            case TAB:
              peaksInstance.emit("kybrd_tab");
              break;
          }
        } else if (t === "keyup") {

          switch (c) {
            case LEFT_ARROW:
              if (event.shiftKey) peaksInstance.emit("kybrd_shift_left");
              else peaksInstance.emit("kybrd_left");
              break;

            case RIGHT_ARROW:
              if (peaksInstance.shiftKey) peaksInstance.emit("kybrd_shift_right");
              else peaksInstance.emit("kybrd_right");
              break;
          }
        }
      }
    };
  }

  return {
    init: function (peaks) {
      document.addEventListener("keydown", handleKeyEventGenerator(peaks));
      document.addEventListener("keypress", handleKeyEventGenerator(peaks));
      document.addEventListener("keyup", handleKeyEventGenerator(peaks));
    }
  };
});
