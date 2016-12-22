'use strict';

define([], function() {
  return function extend(to, from) {
    for (var key in to) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }

    return to;
  };
});
