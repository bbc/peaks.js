module.exports = function(grunt) {

  grunt.initConfig({

    requirejs: {
      compile: {
        options: {
          name: "bower_components/almond/almond",
          baseUrl: '.',
          include: ['peaks'],
          out: "build/js/peaks.min.js",
          paths: {
            "peaks": "src/main",
            "waveform-data": "bower_components/waveform-data/dist/waveform-data",
            "EventEmitter": "bower_components/eventEmitter/EventEmitter"
          },
          wrap: { // https://github.com/jrburke/almond#exporting-a-public-api
            startFile: 'src/frag/start.frag',
            endFile: 'src/frag/end.frag'
          },
          preserveLicenseComments: false,
          generateSourceMaps: true,
          optimize: "uglify2",
          uglify2: {
            mangle: true
          }
        }
      }
    },

    // Quick server for demo'ing / testing purposes using nodes connect
    connect: {
      dev: {
        options: {
          open: 'http://0.0.0.0:8000/demo_page_dev.html'
        }
      },
      demo: {
        options: {
          open: 'http://0.0.0.0:8000/demo_page.html'
        }
      },
      options: {
        keepalive: true,
        port: 8000,
        hostname: '*'
      }
    },

    // Install bower dependencies where necessary and automagically include script tags
    wiredep: {
      dev: {
        src: 'demo_page_dev.html',
        exclude: ['almond']
      },
      demo: {
        src: 'demo_page.html',
        exclude: ['almond', 'eventEmitter', 'waveform-data']
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
        tasks: ['build']
      }
    },

    // Allow blocking tasks such as watch and connect server to be run at the same time
    concurrent: {
      dev: ['watch', 'connect:dev'],
      options: {
        logConcurrentOutput: true
      }
    }

  });

  // Load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-concurrent');


  // Build the project for production
  grunt.registerTask('build', ['wiredep', 'requirejs']);

  // Start a dev server for working on the precompiled files
  grunt.registerTask('server-dev', ['build', 'concurrent:dev']);

  // Start a demo server for displaying the functionality of the fully built component
  grunt.registerTask('server-demo', ['build', 'connect:demo']);

  // Build the project by default
  grunt.registerTask('default', ['server-dev']);

};
