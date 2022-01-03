
# @player.js/core

player.js is a Preact/React media player. It can be used as a standalone player, or as part of your own project.

## What's In The Box

* Friendly, modern user interface 
* Customizable transport controls
* Support for audio and video, both on-demand and live. 
* Auto-detection of appropriate backend (native HTML5, DASH, HLS, etc)

### Planned

* Subtitle (VTT) support

Pull requests welcome! 

## Usage

To allow easy integration into your package, and to provide no dependencies, two builds are available.

* The 'core' build, which can be consumed in any React or Preact project, and is bundled with standard video drivers. 
* The 'static' build is pre-packaged with Preact and is designed for standalone use - but its Player component can't be consumed by React (_but_ the `<video-player />` tag can be rendered in JSX). 

### In a React/Preact Project

Install the package

    yarn add @player.js/core
    (or) yarn add https://github.com/Jamie0/player.js

A very simple example:

    import React from 'react';
    import Player from '@player.js/core';

    export default function renderPlayer ({ playlist }) {
        return <Player autoplay={ true } playlist={ playlist } />
    }


### Vanilla HTML/JS

player.js creates a custom tag called `<video-player />`, and uses the shadow DOM.

In this example, we are using the static build of player.js, which doesn't have any dependencies. By using the shadow DOM, you can likely consume the static of player.js whatever UI framework you use, and avoid styling conflicts. 

    <script type="text/javascript" src="player.js/dist/static/index.umd.js"></script>
    ...
    
    <video-player autoplay playlist='[{"id":"555","type":"video","source":{"href":"https://scdnc.insanityradio.com/manifest/hls/video.m3u8","loader":"hls","live":true,"rewind":{"enable":true,"duration":600}}}]'></video-player>

## Demo

https://index.hm/dev/player/index.html


# Documentation

## API 

You can use most of the standard React properties for media elements, but the event object might not be a native object depending on the driver being used.

### Props

#### `playlist = [PlaylistObject]` (required)

Use the playlist prop to specify the media to load. You can queue media by changing the playlist prop - as long as the current media's ID appears in the updated array, playback will continue uninterrupted. 

    PlaylistObject =
    {
        id: 'uuid', /* a value unique to this item in the playlist */
        type: 'video', /* either video or audio */
        source: {
            href: /* the media URL */
              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            loader: /* force the use of a particular driver, or provide your own */
              [undefined,"dash","hls"], 
            live: false, /* set to true if the source is live */
            rewind: {
                enabled: false, /* enable/disable live seeking */
                duration: 30 /* maximum time to allow rewinding */ 
            }
        }
    }


#### `ref = yourPlayerRef`

Useful if you wish to control the player. 

#### `autoplay = true`

Whether or not to try autoplay (if the browser permits it). 

### Events

The second argument is a `props` object. It includes a reference to the player in case you don't have the ref in scope. 

If using as standalone JavaScript, you can subscribe using the attribute onevent. Use of addEventListener is not yet supported as the DOM won't handle event objects used in drivers. 

#### `onPlay = (event, props)`

#### `onPause = (event, props)`

#### `onCanPlay = (event, props)`

#### `onBuffering = (event, props)`

#### `onStalled = (event, props)`

#### `onPlaying = (event, props)`

#### `onError = (event, props)`

#### `onLoadStart = (event, props)`

#### `onTimeUpdate = (event, { ...props, time, duration, buffered })`

#### `onStateUpdate = (state, event[, props])`

You can access the state enum by importing it: `import { PlayerState } from '@player.js/core'`.  The enum looks like:

`{ NONE, LOADING, ERROR, BUFFERING, PLAYING, PAUSED }`

### Methods and Getters

With a reference to a player.js instance, the followings methods are available:

#### `play(gesture = true)`

Resumes playback of the media. If gesture is set to false, no animation is shown.

#### `pause(gesture = true)`

Pauses playback of the media. If gesture is set to false, no animation is shown.

#### `seek(time)`

Seeks to the current position in playback. If in live mode, provide a negative number equal to the seconds behind the live 'epoch'. 

#### `currentTime`

Returns the time of the playhead. If in live mode, this will be a negative number equal to the number of seconds behind the live 'epoch'. 

#### `playlistItem`

Returns the currently active playlist item. 

#### `load(force)`

If called with true, forces the current media item to be reloaded. This method is automatically called if the playlist is changed [and the current item disappears]. 

### Using Custom Media Drivers

You can define custom media drivers by importing the `protocols` object from `@player.js/core`. Getters noted (Live) must be implemented for live playback and rewind to work, if the driver is to support it. 

    protocols.register(
        {
            name: 'myprotocol',
            extension: 'm3u'
        },
        MyProtocol
    );
    
    /** @interface */    
    class MyProtocol {
        /**
         * fetchResponse - a Response from a HEAD request to the URL
         * playlistItem - the current active playlist item 
         * media - the media (video) element
         */
        constructor (fetchResponse, playlistItem, media) {
            super();
            // optionally set this.loading to a Promise, which should resolve when the driver has instantiated (not necessarily with data). 
            this.loading = new Promise(...);
        }
        
        destroy () {}
        
        /** If defined, will be called with 'buffering' event. */
        addEventListener(event, handler) {}
        
        /** (Live) The number of seconds behind the epoch still considered live */
        get tolerance() { }
        
        /** (Live) The current 'duration' corresponding to epoch time */
        get liveTotalTime() {}
        
        /** (Live) The current time of playback. Usually media.currentTime */
        get currentTime () {}
        
        /** Return a set of {key,text} objects of available quality levels */
        get adaptiveSets() {}
        
        /** Return the currently active quality level */
        get adaptiveSet() {}
    }

player.js uses hls.js and dash.js. These driver implementations may be useful as references. 
