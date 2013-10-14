# Peaks.js - open source audio waveform visualisation.

## By Chris Finch

Our team added the ability to visualise audio waveforms to our Snippets project and now we've decided to open source Peaks.js, the visualisation component.

After the successful release of 'Snippets for Radio' a team of engineers, designers and project managers from IRFS set out explore possible improvements to the Snippets for Radio interface. After outlining these a three week sprint was started to work on some of the improvements with a view to enhancing the user experience and usability of the new snipping tool in snippets for radio.

The team, comprising myself (Chris Finch) and Thomas Parisot as Frontend Engineers, Chris Needham and Matt Haynes as Backend Engineers and Joanne Moore and Andrew Wood as Designers, completed the work under the watchful eye of Rob Cooper as product lead for Snippets and with help from Chris Lowis and others in the team.

In this blog post I will outline the challenges we faced in the process of building and open sourcing the frontend portion of the tool, Peaks.js and our answers to those challenges. Blog posts from a design perspective and a backend technical perspective will also be released by Joanne and Chris.

# Initial choices

In building an interface for  viewing, navigating and interacting with audio waveforms there were a number of initial questions to be answered that meant we had a very open scope for how to approach the problem. We found that due to the sheer amount of options and the varying ideas that people came up with we had a lot of trouble getting off the ground with development.

Here's a few of the considerations we had from an interface perspective:

- Zoom features  (buttons, sliders, etc)
- Levels of zoom (in and out)
- Zoom feedback (how to indicate current zoom level)
- Time displays
- Animations (scroll/playback)
- Navigating waveform
- Playhead/s

We decided to start by representing some waveform data visually in the browser so that we could then work iteratively. This feature also had a number of facets to it:

- What display technology to use (canvas, SVG, webGL, layered images or something else?)
- How to access and process the waveform data (data format, serving mechanism, processing calculations etc)
- Fallback options
- Loading times
- Display portions (How much waveform to show and where)

# Waveform data

Building on some work and ideas from Matt Haynes we decided to try and send our waveform data to the browser in the *most compact form available*, as **binary data**, read in JavaScript thanks to the [Typed Array API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

This meant that audio waveform data could be sent as a single `.dat` file where each byte block represents a sampled [PCM](http://en.wikipedia.org/wiki/Pulse-code_modulation) value. Once the data are acquired, the frontend work is all about rendering them visually.

Binary data have a couple of noticeable advantages over [JSON](http://json.org/):
* they are 2 or 3 times smaller over HTTP
* HTTP compression applies well, dividing the downloaded size by 3
* we can iterate on portions of data without creating new in-memory objects (thanks to `DataView`)

We were happily surprised to notice that parsing a 10MB JSON file had almost no performance impact, at least in Chrome 27.

## Introducing waveform-data.js

As part of our exploratory research, we had to test out Canvas and SVG, JSON and Binary data. Whatever decision we had to make, the way of consuming the data would remain the same.

Hence Thomas created an abstract JavaScript data layer, [waveform-data.js](https://github.com/bbcrd/waveform-data.js).

It provides the following features:
* JSON and Binary Data adapters
* data accessors and helpers
* segments management
* client-side resampling (thanks to the [Audacity project](http://audacity.sourceforge.net/) for their algorithm)
* strong test coverage, user documentation and examples

This serves as a stable basis to make the UI interface simpler to develop: it handles the "data zooming", pagination and any time-related calculations which would clutter Peaks.js code.

# Displaying the data

We dedicated a sprint to decide wether we would use [HTML5 canvas](http://diveintohtml5.info/canvas.html), [SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics) or [WebGL](http://www.khronos.org/webgl/) to display audio waveform data. Our constraint was to cover a wide spectrum of browsers.
We have not retained the WebGL option for this reason; [it requires at least Internet Explorer 11](http://caniuse.com/#feat=webgl).

SVG was close to a one liner solution with the help of [D3.js](http://d3js.org/) and waveform-data.js. Due to our approach we did not feel any performance hit; although displaying a full length programme data at the most precise scale would be too much to draw without simplifying the paths.

Despite the good numbers, we favoured Canvas as we felt it would not be a blocking solution feature-set in the future. We also felt Canvas would be more efficient at dealing with user interactions and synchronising them between the several views, especially overlapping segments and draggable offsets.  
Its ability to be updated using the [browser AnimationFrame API](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame) makes it a clear winner for our purpose.

# Application Structure

Given these choices and constraints we then started coding. We designed and built the application using the [AMD](http://en.wikipedia.org/wiki/Asynchronous_module_definition) module style. It could then be packaged either as a single class that would append itself to the `window` object OR a [require.js](http://requirejs.org) module that could be included in a pre-existing require.js setup as needed by the end user.

[MODULES IMAGE]

[Grunt](http://gruntjs.com/) tasks were set up to allow the automatic building of the project. For development purposes application module files existed as independent require.js modules to ensure [separation of concerns](http://en.wikipedia.org/wiki/Separation_of_concerns). At build time the `grunt build` task would first lint all script files and compile templates ready for building, the task would then inspect the require.js dependancy chain for all of the modules using [r.js](http://requirejs.org/docs/optimization.html) and then concatenate and minify all the files in the correct order for packaging as a single module. The task would then prepend and append code fragments along with [almond.js](https://github.com/jrburke/almond) that would allow the end result file to be included as outlined above.

Using this structure and build process allowed us to code the application in a modular fashion but also provide the end users with the simplest ways of using Peaks.js in their own projects.

# Working with canvas

Initially we worked with vanilla HTML5 canvas to generate our waveforms visually, however we found that due to the fact we needed to have several active layers and event detection that simply using the vanilla implementation became very unwieldy. As a result we decided to use the [KineticJS](https://github.com/ericdrowell/KineticJS/) framework to abstract away a lot of the tricky parts of working with canvas and to give us inbuilt [staging and layering](http://www.html5canvastutorials.com/kineticjs/html5-canvas-shape-layering-with-kineticjs/) of multiple canvases along with normalised [event detection](http://www.html5canvastutorials.com/kineticjs/html5-canvas-path-mouseover/) on Canvas elements. The use of Kinetic removed some of the disadvantages of working with canvas over SVG and allowed us to concentrate more on application logic rather than becoming mired in endless canvas context update loops.

Using KineticJS kept our code [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself) by allowing us to define a base drawing function for plotting waveform coordinate values on the canvas context and then utilise that for the drawing of all different types of waveforms, segments and zoom levels included in Peaks.js.

# Event Driven architecture

Further to our [AMD](http://en.wikipedia.org/wiki/Asynchronous_module_definition) style module pattern we decided to take [Separation of Concerns](http://en.wikipedia.org/wiki/Separation_of_concerns) one step further and utilise a central events [pubsub](http://en.wikipedia.org/wiki/PubSub) stack for inter-module communication within the peaks application.

This meant that rather than direct inter-module function calls a module could publish an event to the event stack without worrying about who was listening to the event. Subsequently any other module in the application could subscribe to that event and then get notified when the event was fired. This allowed modules to only have to worry about themselves and reduced interdependency of the modules.

# Roundup

Peaks.js provides the barebones functionality for rendering, displaying and interactive with audio waveforms in the browser. A lot of effort was put in to ensuring that the Application was concise and did not restrict the options available to the end user for customisation or use. The development process, whilst tricky at times, went smoothly and as a team we are all happy with the quality of the release.

Try it out and send us your feedback on [Github](http://URL.TO/PROJECT).
