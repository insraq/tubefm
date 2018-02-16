/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  StatusBar,
  View,
  TextInput,
  TouchableNativeFeedback,
  NativeModules,
  Alert,
  Image,
  ToastAndroid,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';

import getInfo from './app/ytdl/info';
import CachedStore from './app/support/cached-store';
import { without } from 'lodash';

import RNFS from 'react-native-fs';

const NativeHelpers = NativeModules.NativeHelpers;
const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8+x8AAr8B3gzOjaQAAAAASUVORK5CYII=';

export default class tubefm extends Component {


  constructor(props) {
    super(props);
    this.state = {
      sound: null,
      files: [],
      pending: [],
      ip: null
    };
  }

  componentWillMount() {
    DeviceEventEmitter.addListener('videoIdAdded', this.onVideoIdAdded.bind(this));
  }

  componentDidMount() {
    Promise.all([RNFS.readdir(NativeHelpers.MUSIC_DIR), CachedStore.get('videos')]).then((values) => {
      if (values[0]) this.setState({ files: values[0] });
    });
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('videoIdAdded', this.onVideoIdAdded.bind(this));
  }

  onVideoIdAdded(e) {
    this.addVideoId(e.videoId);
  }

  addVideoId(videoId) {
    if (!videoId) return ToastAndroid.show("The Video ID cannot be empty", ToastAndroid.SHORT);
    if (this.state.files.indexOf(videoId) !== -1) return ToastAndroid.show("The Video ID already exists", ToastAndroid.SHORT);
    this.setState({
      files: [videoId].concat(without(this.state.files, videoId))
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#999" barStyle="dark-content" />
        <TouchableNativeFeedback onPress={() => {
          if (this.state.ip) {
            NativeHelpers.stopServer();
            this.setState({ ip: null });
          } else {
            NativeHelpers.startServer().then((e) => this.setState({ ip: e.ip }));
          }
        }}>
          <View style={{ paddingHorizontal: 10, flexDirection: 'row', height: 44, alignItems: 'center' }}>
            <Text style={{ flexGrow: 1, fontWeight: 'bold', color: '#333', fontSize: 18 }}>
              {this.state.ip ? `http://${this.state.ip}:8765` : 'TubeFM'}
            </Text>
            <Text style={{ fontWeight: 'bold' }}>
              {this.state.ip ? 'TURN OFF' : 'TURN ON WEB UI'}
            </Text>
          </View>
        </TouchableNativeFeedback>
        <View style={{ backgroundColor: '#ccc', height: StyleSheet.hairlineWidth }} />
        <View style={{ backgroundColor: '#eee', height: StyleSheet.hairlineWidth * 2 }} />
        <View style={{ backgroundColor: '#f1f1f1', paddingHorizontal: 10, borderBottomColor: '#ddd', borderBottomWidth: StyleSheet.hairlineWidth }}>
          <TextInput
            returnKeyType="done"
            underlineColorAndroid="transparent"
            style={{ flexGrow: 1, fontSize: 24, color: '#666' }}
            placeholder="youtube.com/watch?v="
            onSubmitEditing={(e) => this.addVideoId(e.nativeEvent.text)} />
        </View>
        {this.state.pending.map((f, i) => (
          <View key={i} style={styles.block}>
            <Image resizeMode="cover" source={{ uri: DEFAULT_IMAGE }} style={{ height: 138 / 3, width: 246 / 3 }} />
            <Text numberOfLines={1} style={{ fontWeight: 'bold', paddingHorizontal: 10, flex: 1 }}>{f}</Text>
            <Text style={{ paddingRight: 10 }}>Queueing...</Text>
          </View>
        ))}
        <ScrollView style={{ flexGrow: 1 }}>
          {this.state.files.map((f) => <PlayableItem fileName={f} key={f} onRemove={(r) => this.setState({ files: without(this.state.files, r) })} />)}
        </ScrollView>
        <View style={{ backgroundColor: '#ddd', height: StyleSheet.hairlineWidth }} />
      </View>
    );
  }
}

class PlayableItem extends Component {
  constructor(props) {
    super(props);
    this.state = { fileName: props.fileName, file: {}, downloading: null };
  }
  componentDidMount() {
    this.fetchData();
  }
  fetchData() {
    CachedStore.get('videos').then((data) => {
      if (data && data[this.props.fileName]) {
        this.setState({ file: data[this.props.fileName] });
      }
      this.download();
    });
  }
  download() {
    RNFS.exists(`${NativeHelpers.MUSIC_DIR}/${this.props.fileName}.m4a`).then((exists) => {
      if (exists) return;
      this.setState({ downloading: 'Downloading...' });
      getInfo(`https://www.youtube.com/watch?v=${this.state.fileName}`, (error, info) => {
        if (error) {
          alert(error);
          return this.props.onRemove(this.state.fileName);
        }
        var format = info.formats.filter((f) => f.type && f.type.match(/audio\/mp4/))[0];
        var filePath = `${NativeHelpers.MUSIC_DIR}/${info.video_id}.m4a`;
        var fileInfo = { title: info.title, id: info.video_id, thumbnail: info.thumbnail_url };
        var obj = {};
        obj[fileInfo.id] = fileInfo;
        this.setState({ file: fileInfo });
        var result = RNFS.downloadFile({
          fromUrl: format.url,
          toFile: filePath,
          progress: (p) => this.setState({ downloading: Math.round(p.bytesWritten * 100 / p.contentLength) + '%' }),
          progressDivider: 5,
        });
        result.promise.then(() => {
          this.setState({ downloading: null });
          CachedStore.get('videos').then((data) => CachedStore.set('videos', Object.assign(data || {}, obj)));
        });
      });
    });
  }
  render() {
    var f = this.state.file;
    var Container = this.state.downloading ? View : TouchableNativeFeedback;
    return (
      <Container
        onPress={() => NativeHelpers.playAudio(`${NativeHelpers.MUSIC_DIR}/${this.state.fileName}.m4a`)}
        onLongPress={() => Alert.alert('Delete this file?', `You cannot undo this.`, [
          { text: 'Cancel', onPress: () => { } },
          {
            text: 'Delete', onPress: () => {
              RNFS.unlink(`${NativeHelpers.MUSIC_DIR}/${this.state.fileName}.m4a`);
              this.props.onRemove(this.state.fileName);
            }
          },
        ])}>
        <View style={styles.block}>
          <Image resizeMode="cover" source={{ uri: !f.thumbnail ? DEFAULT_IMAGE : f.thumbnail.replace('default.jpg', 'hqdefault.jpg') }} style={{ height: 138 / 3, width: 246 / 3 }} />
          <Text numberOfLines={1} style={{ fontWeight: 'bold', paddingHorizontal: 10, flex: 1 }}>{f.title || f.id}</Text>
          {!this.state.downloading ? null : <Text style={{ paddingRight: 10 }}>{this.state.downloading}</Text>}
        </View>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  block: {
    height: 138 / 3,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth
  }
});

AppRegistry.registerComponent('tubefm', () => tubefm);
