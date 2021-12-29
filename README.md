# player.js

player.js is a Preact/React media player. It can be used as a standalone player, or as part of your own project.


## Spec

* Customizable transport controls
* Support for audio and video
* Auto-detection of appropriate backend (native HTML5, DASH, HLS, M3U, etc)

### Planned

* Subtitle (VTT) support

## Usage

### In a React/Preact Project

Install the package

    yarn add https://github.com/Jamie0/player.js

Then, simply require

    import Player from 'player.js';

### Vanilla HTML/JS

player.js creates a custom tag called &lt;video-player /&gt;.

    <script type="text/javascript" src="player.js/dist/index.umd.js"></script>
    ...
    
    <video-player autoplay playlist='[{"id":"555","type":"video","source":{"href":"https://scdnc.insanityradio.com/manifest/hls/video.m3u8","loader":"hls","live":true,"rewind":{"enable":true,"duration":600}}}]'></video-player>

## Demo

https://index.hm/dev/player/index.html

