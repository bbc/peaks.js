define([], function() {
  'use strict';

  var SPACE = 32,
      TAB = 9,
      LEFT_ARROW = 37,
      RIGHT_ARROW = 39;

  function handleKeyEventGenerator(peaksInstance) {

    /**
     * Arrow keys only triggered on keydown, not keypress
     */
    return function handleKeyEvent(event) {
      var nodes = ['OBJECT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'];

      if (nodes.indexOf(event.target.nodeName) === -1) {
        if ([SPACE, TAB, LEFT_ARROW, RIGHT_ARROW].indexOf(event.type) > -1) {
          event.preventDefault();
        }

        if (event.type === 'keydown' || event.type === 'keypress') {
          switch (event.keyCode) {
            case SPACE:
              peaksInstance.emit('keyboard.space');
              break;

            case TAB:
              peaksInstance.emit('keyboard.tab');
              break;
          }
        }
        else if (event.type === 'keyup') {
          switch (event.keyCode) {
            case LEFT_ARROW:
              if (event.shiftKey) {
                peaksInstance.emit('keyboard.shift_left');
              }
              else {
                peaksInstance.emit('keyboard.left');
              }
              break;

            case RIGHT_ARROW:
              if (event.shiftKey) {
                peaksInstance.emit('keyboard.shift_right');
              }
              else {
                peaksInstance.emit('keyboard.right');
              }
              break;
          }
        }
      }
    };
  }

  return {
    init: function(peaks) {
      document.addEventListener('keydown', handleKeyEventGenerator(peaks));
      document.addEventListener('keypress', handleKeyEventGenerator(peaks));
      document.addEventListener('keyup', handleKeyEventGenerator(peaks));
    }
  };
});
