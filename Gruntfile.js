module.exports = function(grunt) {

  grunt.initConfig({

    // JS Lint on all non-vendor files
    jshint: {
      all: [
        'src/**/*.js'
      ]
    },

//    requirejs: {
//      compile: {
//        options: {
//          name: "bower_components/almond/almond",
//          baseUrl: '.',
//          include: ['peaks'],
//          out: "build/js/peaks.min.js",
//          paths: {
//            "peaks": "src/main",
//            "waveform-data": "bower_components/waveform-data/dist/waveform-data.min",
//            "EventEmitter": "bower_components/eventEmitter/EventEmitter"
//          },
//          wrap: { // https://github.com/jrburke/almond#exporting-a-public-api
//            startFile: 'src/frag/start.frag',
//            endFile: 'src/frag/end.frag'
//          },
//          optimize: "uglify2",
//          uglify2: {
//            mangle: true
//          }
//        }
//      }
//    },

    // Quick server for demo'ing / testing purposes using nodes connect
    connect: {
      server: {
        options: {
          keepalive: true
        }
      }
    },

    // Open a browser at the correct page for demo or development
    open : {
      dev : {
        path: 'http://0.0.0.0:8000/demo_page_dev.html'
      },
      demo: {
        path: 'http://0.0.0.0:8000/demo_page.html'
      }
    },

    // Install bower dependencies where necessary and automagically include script tags
    'bower-install': {
      dev: {
        src: 'demo_page_dev.html' // Only allows one file so DEV page is currently copy-pasted from demo page..
      },
      demo: {
        src: 'demo_page.html' // Only allows one file so DEV page is currently copy-pasted from demo page..
      }
    },

    // Watch precompiled files and compile on change triggering a livereload event on the dev page
    watch: {
      options: {
        livereload: 1337
      },
      js: {
        files: ['src/*.js']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'build', 'karma:unit:run']
      }
    },

    // Allow blocking tasks such as watch and connect server to be run at the same time
    concurrent: {
      server: ['watch', 'connect', 'open:dev'],
      options: {
        logConcurrentOutput: true
      }
    }

  });

  // Load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-bower-install');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-concurrent');


  // Reqister task names

  // Build the project for production
  grunt.registerTask('build', ['bower-install', 'jshint:all']);

  // Start a dev server for working on the precomiled files
  grunt.registerTask('server-dev', ['build', 'concurrent:server']);

  // Start a demo server for displaying the functionality of the fully built component
  grunt.registerTask('server-demo', ['build', 'open:demo', 'connect']);

  // Build the project by default
  grunt.registerTask('default', ['server-dev']);

};
