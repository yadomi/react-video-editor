import React, { Component } from 'react';
import { append, map } from 'ramda';
import Debounce from 'lodash.debounce';
import './App.css';

class Timeline extends Component {

  thumbnail = [];
  state = {
    thumbnails: [],
    cursorX: 0,
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

  _handleResize = () => {
    this.video.currentTime = 0.1;
    this.thumbnails = [];
  }

  _handleLoadMeta = event => {
    this.video.currentTime = 0.1;
  }

  _handleSeek = event => {
    this.thumbnails = append(this.getCurrentFrame(), this.thumbnails);
    const frameCount = Math.ceil(this.timelineDOM.clientWidth / 110);

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
      cursorX: position
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
    const { thumbnails, cursorX } = this.state;
    
    const cursorStyle = {
      transform: `translateX(${cursorX}px)`,
    };

    return (
      <div 
        className="Timeline" 
        ref={ ref => { this.timelineDOM = ref } }
        onMouseMove={ this._handleMouseMove }
        >
      { map(thumbnail =>
        <div>
          <img src={ thumbnail } alt=""/>
        </div>, thumbnails) }
      <div className="cursor" style={ cursorStyle }/>
      </div>
    );
  }
}

class Composition extends Component {

  componentWillReceiveProps({ currentTime }) {
    this.videoDOM.currentTime = currentTime; 
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
    currentTime: 0
  }

  _handleMove = currentTime => {
    this.setState({
      currentTime
    })
  }

  render () {
    const video = "http://localhost:3000/video/big_buck_bunny.webm";
    const { currentTime } = this.state;
    return (
      <div className="App">
        <Composition 
          src={ video }
          currentTime={ currentTime }
        />
        <Timeline 
          src={ video }
          onMove={ this._handleMove } 
        />
      </div>
    )
  }
}


export default App;
