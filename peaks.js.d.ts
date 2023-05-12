/**
 * Peaks.js TypeScript Definitions
 * @author Evan Louie <evan.louie@microsoft.com> (https://evanlouie.com)
 */

declare module 'peaks.js' {
  import WaveformData from 'waveform-data';

  type Without<T> = { [K in keyof T]?: undefined };
  type XOR<T, U> = (Without<T> & U) | (T & Without<U>);
  type OneOf<T, U, V> = (T & Without<U> & Without<V>) |
                        (Without<T> & U & Without<V>) |
                        (Without<T> & Without<U> & V);

  interface LinearGradientColor {
    linearGradientStart: number;
    linearGradientEnd: number;
    linearGradientColorStops: (string | number)[];
  }

  type WaveformColor = string | LinearGradientColor;

  interface SegmentAddOptions {
    startTime: number;
    endTime: number;
    editable?: boolean;
    color?: WaveformColor;
    labelText?: string;
    id?: string;
    [userAttributes: string]: unknown;
  }

  interface SegmentUpdateOptions {
    startTime?: number;
    endTime?: number;
    editable?: boolean;
    color?: WaveformColor;
    labelText?: string;
    [userAttributes: string]: unknown;
  }

  interface Segment extends SegmentAddOptions {
    update: (options: SegmentUpdateOptions) => void;
  }

  interface PointAddOptions {
    time: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    id?: string;
    [userAttributes: string]: unknown;
  }

  interface PointUpdateOptions {
    time?: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    [userAttributes: string]: unknown;
  }

  interface Point extends PointAddOptions {
    update: (options: PointUpdateOptions) => void;
  }

  type LabelHorizontalAlign = 'left' | 'center' | 'right';
  type LabelVerticalAlign = 'top' | 'middle' | 'bottom';

  interface SegmentDisplayOptions {
    markers?:                   boolean;
    overlay?:                   boolean;
    startMarkerColor?:          string;
    endMarkerColor?:            string;
    waveformColor?:             WaveformColor;
    overlayColor?:              string;
    overlayOpacity?:            number;
    overlayBorderColor?:        string;
    overlayBorderWidth?:        number;
    overlayCornerRadius?:       number;
    overlayOffset?:             number;
    overlayLabelAlign?:         LabelHorizontalAlign;
    overlayLabelVerticalAlign?: LabelVerticalAlign;
    overlayLabelPadding?:       number;
    overlayLabelColor?:         string;
    overlayFontFamily?:         string;
    overlayFontSize?:           number;
    overlayFontStyle?:          string;
  }

  /**
   * These options can only be set globally, and not separately for the
   * the zoomview and overview waveforms.
   */

  interface GlobalSegmentDisplayOptions extends SegmentDisplayOptions {
    waveformColor?: WaveformColor;
    overlayColor?:  string;
  }

  type FormatTimeFunction = (time: number) => string;

  interface ViewOptions {
    axisGridlineColor?: string;
    axisLabelColor?: string;
    container?: HTMLElement | null;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: string;
    playedWaveformColor?: WaveformColor;
    playheadColor?: string;
    showPlayheadTime?: boolean;
    playheadTextColor?: string;
    formatPlayheadTime?: FormatTimeFunction;
    timeLabelPrecision?: number;
    showAxisLabels?: boolean;
    formatAxisTime?: FormatTimeFunction;
    waveformColor?: WaveformColor;
    segmentOptions?: SegmentDisplayOptions;
  }

  interface ZoomViewOptions extends ViewOptions {
    wheelMode?: "none" | "scroll";
    playheadClickTolerance?: number;
  }

  interface OverviewOptions extends ViewOptions {
    /**
     * The default number of pixels from the top and bottom of the canvas
     * that the overview highlight rectangle
     */
    highlightOffset?: number;
    /**
     * Color for the overview waveform rectangle that shows the region
     * visible in the zoomable waveform view
     */
    highlightColor?: string;
    highlightStrokeColor?: string;
    highlightOpacity?: number;
    highlightCornerRadius?: number;
  }

  interface ScrollbarOptions {
    container: HTMLElement;
    color?: string;
    minWidth?: number;
  }

  interface ContainerOptions {
    zoomview?: ZoomViewOptions;
    overview?: OverviewOptions;
    scrollbar?: ScrollbarOptions;
  }

  interface RemoteWaveformDataOptions {
    /** URI to waveform data file in binary or JSON */
    dataUri?: {
      arraybuffer?: string;
      json?: string;
    }
  }

  export interface JsonWaveformData {
    version: number;
    channels: number;
    sample_rate: number;
    samples_per_pixel: number;
    bits: number;
    length: number;
    data: number[];
  }

  interface LocalWaveformDataOptions {
    /** raw waveform data file in binary or JSON */
    waveformData?: {
      arraybuffer?: ArrayBuffer;
      json?: JsonWaveformData;
    }
  }

  interface WebAudioOptions {
    webAudio: {
      /**
       * A Web Audio AudioContext instance which can be used
       * to render the waveform if dataUri is not provided
       */
      audioContext?: AudioContext;
      /**
       * Alternatively, provide an AudioBuffer containing the decoded audio
       * samples. In this case, an AudioContext is not needed
       */
      audioBuffer?: AudioBuffer;
      scale?: number;
      multiChannel?: boolean;
    }
  }

  type AudioOptions = OneOf<RemoteWaveformDataOptions, LocalWaveformDataOptions, WebAudioOptions>;

  export interface PointMarker {
    init: (group: object) => void; // TODO: group: Konva.Group
    fitToView: () => void;
    timeUpdated?: (time: number) => void;
    update?: () => void;
    destroy?: () => void;
  }

  export interface SegmentMarker {
    init: (group: object) => void; // TODO: group: Konva.Group
    fitToView: () => void;
    timeUpdated?: (time: number) => void;
    update?: () => void;
    destroy?: () => void;
  }

  export interface Layer {
    getHeight: () => number;
    draw: () => void;
  }

  export interface CreatePointMarkerOptions {
    point: Point;
    view: string;
    draggable: boolean;
    color: string;
    layer: Layer;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
  }

  export interface CreateSegmentMarkerOptions {
    segment: Segment;
    view: string;
    draggable: boolean;
    color: WaveformColor;
    layer: Layer;
    startMarker: boolean;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    segmentOptions: SegmentDisplayOptions;
  }

  export interface CreateSegmentLabelOptions {
    segment: Segment;
    view: string;
    layer: Layer;
  }

  interface OptionalOptions {
    /** HTML5 Media element containing an audio track. Optional when using an external player */
    mediaElement?: Element;
    /**
     * If true, peaks will send credentials with all network requests
     * - i.e. when fetching waveform data.
     */
    withCredentials?: boolean;
    /** async logging function */
    logger?: (...args: any[]) => void;
    /** Array of zoom levels in samples per pixel (big >> small) */
    zoomLevels?: number[];
    /** Enable or disable the waveform cache */
    waveformCache?: boolean;
    /** Bind keyboard controls */
    keyboard?: boolean;
    /** Keyboard nudge increment in seconds (left arrow/right arrow) */
    nudgeIncrement?: number;
    /**
     * Options that control segment appearance
     */
    segmentOptions?: GlobalSegmentDisplayOptions;
    /**
     * Waveform color (or use zoomview.waveformColor and overview.waveformColor
     * to set the waveform color for each view)
     */
    waveformColor?: WaveformColor;
    /** Color of the play head */
    playheadColor?: string;
    /** Show current time next to the playhead (zoomview only) */
    showPlayheadTime?: boolean;
    /** Color of the playhead timestamp label */
    playheadTextColor?: string;
    /** Returns a string for the playhead timestamp label */
    formatPlayheadTime?: FormatTimeFunction;
    /** Precision of time label for play head and point/segment markers */
    timeLabelPrecision?: number;
    /** Show or hide the time axis labels */
    showAxisLabels?: boolean;
    /** Returns a string for the axis label timestamps */
    formatAxisTime?: FormatTimeFunction;
    /**
     * Default point marker color
     */
    pointMarkerColor?: string;
    /** Color of the axis gridlines */
    axisGridlineColor?: string;
    /** Color of the axis labels */
    axisLabelColor?: string;
    /** Font family, for axis labels, playhead, and point and segment markers */
    fontFamily?: string;
    /** Font size, in px */
    fontSize?: number;
    /** Font style, either 'bold', 'normal', 'italic' */
    fontStyle?: string;
    /**
     * Zoom view adapter to use.
     * - Valid adapters are: `'animated'` (default) and `'static'`
     */
    zoomAdapter?: string;
    /** Array of initial segment objects */
    segments?: SegmentAddOptions[];
    /** Array of initial point objects */
    points?: PointAddOptions[];
    /** Emit cue events when playing */
    emitCueEvents?: boolean;
    /** Custom segment marker factory function */
    createSegmentMarker?: (options: CreateSegmentMarkerOptions) => SegmentMarker | null;
    /** Custom segment label factory function */
    createSegmentLabel?: (options: CreateSegmentLabelOptions) => object | null; // Konva.Node;
    /** Custom point marker factory function */
    createPointMarker?: (options: CreatePointMarkerOptions) => PointMarker;
    /** External Player */
    player?: PlayerAdapter;
  }

  interface SetSourceRequiredOptions {
    mediaUrl?: string;
    withCredentials?: boolean;
  }

  type SetSourceOptions = SetSourceRequiredOptions & AudioOptions;

  type SetSourceCallback = (error: Error) => void;

  interface WaveformViewMouseEvent {
    time: number;
    evt: MouseEvent;
  }

  interface WaveformViewPointerEvent {
    time: number;
    evt: PointerEvent;
  }

  interface PointMouseEvent {
    point: Point;
    evt: MouseEvent;
  }

  interface PointPointerEvent {
    point: Point;
    evt: PointerEvent;
  }

  interface SegmentMouseEvent {
    segment: Segment;
    evt: MouseEvent;
  }

  interface SegmentPointerEvent {
    segment: Segment;
    evt: PointerEvent;
  }

  interface SegmentDragEvent {
    segment: Segment;
    marker: boolean;
    startMarker: boolean;
    evt: MouseEvent;
  }

  interface InstanceEvents {
    'peaks.ready': () => void;
    'points.add': (points: Point[]) => void;
    'points.click': (event: PointMouseEvent) => void;
    'points.dblclick': (event: PointMouseEvent) => void;
    'points.contextmenu': (event: PointPointerEvent) => void;
    'points.dragend': (event: PointMouseEvent) => void;
    'points.dragmove': (event: PointMouseEvent) => void;
    'points.dragstart': (event: PointMouseEvent) => void;
    'points.mouseenter': (event: PointMouseEvent) => void;
    'points.mouseleave': (event: PointMouseEvent) => void;
    'points.remove_all': () => void;
    'points.remove': (points: Point[]) => void;
    'points.enter': (point: Point) => void;
    'segments.add': (segments: Segment[]) => void;
    'segments.dragstart': (event: SegmentDragEvent) => void;
    'segments.dragged': (event: SegmentDragEvent) => void;
    'segments.dragend': (event: SegmentDragEvent) => void;
    'segments.remove_all': () => void;
    'segments.remove': (segments: Segment[]) => void;
    'segments.mouseenter': (event: SegmentMouseEvent) => void;
    'segments.mouseleave': (event: SegmentMouseEvent) => void;
    'segments.mousedown': (event: SegmentMouseEvent) => void;
    'segments.mouseup': (event: SegmentMouseEvent) => void;
    'segments.click': (event: SegmentMouseEvent) => void;
    'segments.dblclick': (event: SegmentMouseEvent) => void;
    'segments.contextmenu': (event: SegmentPointerEvent) => void;
    'segments.enter': (segment: Segment) => void;
    'segments.exit': (segment: Segment) => void;
    'overview.click': (event: WaveformViewMouseEvent) => void;
    'zoomview.click': (event: WaveformViewMouseEvent) => void;
    'overview.dblclick': (event: WaveformViewMouseEvent) => void;
    'zoomview.dblclick': (event: WaveformViewMouseEvent) => void;
    'overview.contextmenu': (event: WaveformViewPointerEvent) => void;
    'zoomview.contextmenu': (event: WaveformViewPointerEvent) => void;
    'zoom.update': (currentZoomLevel: number, previousZoomLevel: number) => void;
  }

  interface PlayerEvents {
    'player.canplay': () => void;
    'player.ended': () => void;
    'player.error': (error: any) => void;
    'player.pause': (time: number) => void;
    'player.playing': (time: number) => void;
    'player.seeked': (time: number) => void;
    'player.timeupdate': (time: number) => void;
  }

  interface PeaksEvents extends InstanceEvents, PlayerEvents {
  }

  interface PlayerAdapter {
    init: (eventEmitter: EventEmitterForPlayerEvents) => Promise<void>;
    destroy: () => void;
    play: () => Promise<void>;
    pause: () => void;
    isPlaying: () => boolean;
    isSeeking: () => boolean;
    getCurrentTime: () => number;
    getDuration: () => number;
    seek: (time: number) => void;
  }

  interface EventEmitterForPlayerEvents {
    emit<E extends keyof PlayerEvents>(event: E, ...eventData: EventData<PlayerEvents[E]>): void;
  }

  type EventData<T> = [T] extends [(...eventData: infer U) => any] ? U : [T] extends [void] ? [] : [T];

  interface WaveformView {
    setAmplitudeScale: (scale: number) => void;
    setWaveformColor: (color: WaveformColor) => void;
    setPlayedWaveformColor: (color: WaveformColor | null) => void;
    showPlayheadTime: (show: boolean) => void;
    setTimeLabelPrecision: (precision: number) => void;
    showAxisLabels: (show: boolean) => void;
    enableMarkerEditing: (enable: boolean) => void;
    enableSeek: (enable: boolean) => void;
    fitToContainer: () => void;
  }

  interface WaveformOverview extends WaveformView {
  }

  interface SetWheelModeOptions {
    captureVerticalScroll?: boolean;
  }

  interface WaveformZoomView extends WaveformView {
    enableAutoScroll: (enable: boolean) => void;
    scrollWaveform: (options: XOR<{ seconds: number }, { pixels: number }>) => void;
    setStartTime: (time: number) => void;
    setWheelMode: (mode: 'scroll' | 'none', options?: SetWheelModeOptions) => void;
    setZoom: (options: XOR<{ scale: number | 'auto' }, { seconds: number | 'auto' }>) => void;
    enableSegmentDragging: (enable: boolean) => void;
    setSegmentDragMode: (mode: 'overlap' | 'no-overlap' | 'compress') => void;
    setMinSegmentDragWidth: (width: number) => void;
  }

  export interface PeaksInstance {
    setSource: (options: SetSourceOptions, callback: SetSourceCallback) => void;
    getWaveformData: () => WaveformData;
    destroy: () => void;
    /** Player API */
    player: {
      play: () => Promise<void>;
      pause: () => void;
      getCurrentTime: () => number;
      getDuration: () => number;
      seek: (time: number) => void;
      playSegment: (segment: Segment, loop?: boolean) => Promise<void>;
    };
    /** Views API */
    views: {
      createOverview: (container: HTMLElement) => WaveformOverview;
      createZoomview: (container: HTMLElement) => WaveformZoomView;
      destroyOverview: () => void;
      destroyZoomview: () => void;
      getView(name?: null): WaveformView | null;
      getView(name: 'overview'): WaveformOverview | null;
      getView(name: 'zoomview'): WaveformZoomView | null;
    };
    /** Zoom API */
    zoom: {
      zoomOut: () => void;
      zoomIn: () => void;
      setZoom: (index: number) => void;
      getZoom: () => number;
    };
    /** Segments API */
    segments: {
      add(segment: SegmentAddOptions): Segment;
      add(segments: SegmentAddOptions[]): Segment[];
      getSegments: () => Segment[];
      getSegment: (id: string) => Segment | undefined;
      removeByTime: (startTime: number, endTime?: number) => Segment[];
      removeById: (segmentId: string) => Segment[];
      removeAll: () => void;
    };
    /** Points API */
    points: {
      add(point: PointAddOptions): Point;
      add(points: PointAddOptions[]): Point[];
      getPoints: () => Point[];
      getPoint: (id: string) => Point | undefined;
      removeByTime: (time: number) => Point[];
      removeById: (id: string) => Point[];
      removeAll: () => void;
    };
    /** Events */
    on: <E extends keyof PeaksEvents>(event: E, listener: PeaksEvents[E]) => void;
    once: <E extends keyof PeaksEvents>(event: E, listener: PeaksEvents[E]) => void;
    off: <E extends keyof PeaksEvents>(event: E, listener: PeaksEvents[E]) => void;
  }

  export type PeaksOptions = OptionalOptions & AudioOptions & ContainerOptions;

  type PeaksInitCallback = (error: Error, peaks?: PeaksInstance) => void;

  export default class Peaks {
    static init(options: PeaksOptions, callback?: PeaksInitCallback): void;
  }
}
