define(['EventEmitter'], function (EventEmitter) {

  var pubsub = new EventEmitter();

  var bootstrap = {
    pubsub: pubsub
  };

  return bootstrap;
});
