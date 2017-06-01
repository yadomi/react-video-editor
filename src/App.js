import React, { Component } from 'react';
import { append, map, range } from 'ramda';
import Debounce from 'lodash.debounce';
import leftpad from 'leftpad';
import './App.css';

class Timeline extends Component {

  thumbnail = [];
  state = {
    thumbnails: [],
    duration: 0,
    handCursorX: 0,
    playCursorX: 0,
  }

  componentDidMount() {
    const video = document.createElement('video');
    video.setAttribute('crossOrigin', 'anonymous');

    video.addEventListener('loadeddata', this._handleLoadMeta);
    video.addEventListener('seeked', this._handleSeek);

    video.src = this.props.src;
    this.video = video;

    window.addEventListener('resize', Debounce(this._handleResize, 300));
  }

  componentWillReceiveProps ({ currentTime }) {
    if (currentTime !== this.props.currentTime) {
      const { left, width } = this.timelineDOM.getBoundingClientRect();
      const { duration } = this.video;
      const position = width * currentTime / duration

      this.setState({
        playCursorX: position
      });
    }
  }

  _handleResize = () => {
    this.video.currentTime = 0.1;
    this.thumbnails = [];
  }

  _handleLoadMeta = event => {
    this.setState({
      duration: this.video.duration,
    });
    this.video.currentTime = 0.1;
  }

  _handleSeek = event => {
    this.thumbnails = append(this.getCurrentFrame(), this.thumbnails);
    const frameCount = Math.ceil(this.timelineDOM.clientWidth / 110) + 1;

    if (this.video.currentTime < Math.floor(this.video.duration)) {
      this.video.currentTime = this.video.currentTime + (this.video.duration / frameCount);
    } else {
      this.setState({
        thumbnails: this.thumbnails,
      })
    }
  }

  _handleMouseMove = event => {
    const { pageX } = event;
    const { left, width } = this.timelineDOM.getBoundingClientRect();
    const { duration } = this.video;
    const position = pageX - left;

    const currentTime = position * duration / width;
    this.props.onMove(currentTime);

    this.setState({
      handCursorX: position
    })
  }

  getCurrentFrame () {
    const { videoHeight, videoWidth } = this.video;
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth / 4;
    canvas.height = videoHeight / 4;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, videoWidth / 4, videoHeight / 4);
    return canvas.toDataURL();
  }


  render() {
    const { thumbnails, handCursorX, playCursorX, duration } = this.state;
    const { isPlaying } = this.props;
    
    const handCursorStyle = {
      transform: `translateX(${handCursorX}px)`,
    };

    const playCursorStyle = isPlaying ? {
      transform: `translateX(${playCursorX}px)`,
    } : {};

    return (
      <div 
        data-is-playing={ isPlaying }
        className="Timeline" 
        ref={ ref => { this.timelineDOM = ref } }
        onMouseMove={ this._handleMouseMove } >
        { map(thumbnail =>
          <div>
            <img src={ thumbnail } alt=""/>
          </div>, thumbnails) 
        }
        <div className="cursor-hand" style={ handCursorStyle }/>
        <div className="cursor-play" style={ playCursorStyle }/>
      </div>
    );
  }
}

class Composition extends Component {

  componentDidMount () {
   this.videoDOM.addEventListener('timeupdate', this._handleTimeUpdate); 
  }

  _handleTimeUpdate = event => {
    const { isPlaying, onTimeChange } = this.props;
    onTimeChange(this.videoDOM.currentTime);
  }

  componentWillReceiveProps({ currentTime, isPlaying }) {
    if (currentTime !== this.props.currentTime) {
      this.videoDOM.currentTime = currentTime; 
    }

    if (isPlaying && !this.props.isPlaying) {
      this.videoDOM.play();
    }

    if (!isPlaying && this.props.isPlaying) {
      this.videoDOM.pause();
    }
  }

  render () {
    return (
      <div className="Composition">
        <video
          src={ this.props.src }
          ref={ ref => { this.videoDOM = ref } }/>
      </div>
    )
  }

}


class App extends Component {

  state = {
    currentTimeFromTimeline: 0,
    currentTimeFromVideo: 0,
    isPlaying: false,
  }

  componentDidMount() {
    window.document.addEventListener('keydown', this._handleKeyDown);
  }

  _handleKeyDown = event => {
    event.preventDefault();
    const { code } = event;

    if (code === "Space") {
      this.setState({
        isPlaying: !this.state.isPlaying
      })
    }

  }

  _handleMove = currentTime => {
    this.setState({
      currentTimeFromTimeline: currentTime,
      isPlaying: false,
    })
  }

  _handleTimeChange = currentTime => {
    this.setState({
      currentTimeFromVideo: currentTime,
    })
  }

  render () {
    const video = "http://localhost:3000/video/big_buck_bunny.webm";
    const { currentTimeFromVideo, currentTimeFromTimeline, isPlaying } = this.state;
    return (
      <div className="App">
        <Composition 
          src={ video }
          isPlaying={ isPlaying }
          currentTime={ currentTimeFromTimeline }
          onTimeChange={ this._handleTimeChange }
        />
        <Timeline 
          src={ video }
          isPlaying={ isPlaying }
          currentTime={ currentTimeFromVideo }
          onMove={ this._handleMove } 
        />
      </div>
    )
  }
}


export default App;
