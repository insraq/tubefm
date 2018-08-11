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
  Dimensions,
  Image,
  ToastAndroid,
  ActivityIndicator,
  ScrollView,
  FlatList,
  DeviceEventEmitter,
} from 'react-native';

import getInfo from './app/ytdl/info';
import CachedStore from './app/support/cached-store';
import { without } from 'lodash';

const NativeHelpers = NativeModules.NativeHelpers;

export default class tubefm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      ip: null,
      info: null,
      loading: false,
    };
  }

  componentWillMount() {
    DeviceEventEmitter.addListener('videoIdAdded', this._onVideoIdAdded);
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('videoIdAdded', this._onVideoIdAdded);
  }

  _onVideoIdAdded = (e) => {
    this.getVideoInfo(e.videoId);
  }

  getVideoInfo = (videoId) => {
    this.setState({ loading: true });
    getInfo(`https://www.youtube.com/watch?v=${videoId}`, (error, info) => {
      if (error) {
        alert(error);
        this.setState({ loading: false });
        return;
      }
      this.setState({ info: info, loading: false });
    });
  }

  _renderVideoInfo = () => {
    if (this.state.loading) return (
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    );
    if (!this.state.info) return null;
    const { info } = this.state;
    var { height, width } = Dimensions.get('window')
    return (
      <View style={{ flex: 1 }}>
        <View>
          <Image
            resizeMode="cover"
            source={{ uri: info.thumbnail_url.replace('default.jpg', 'hqdefault.jpg') }}
            style={{ height: width * 9 / 16, width: width }}
          />
          <View style={{
            paddingHorizontal: 20,
            backgroundColor: 'rgba(0,0,0,0.6)',
            height: 50,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text numberOfLines={1} style={{ fontSize: 20, color: '#fff' }}>{info.title}</Text>
          </View>
        </View>
        <FlatList
          style={{ flex: 1 }}
          keyExtractor={(i) => i.itag}
          data={info.formats}
          renderItem={this._renderRow}
        />
      </View >
    );
  }

  _renderRow = ({ item }) => {
    const { info } = this.state;
    return (
      <TouchableNativeFeedback onPress={() => {
        const fileName = `${info.title}.${item.container}`;
        ToastAndroid.show(`Downloading...`, ToastAndroid.SHORT);
        NativeHelpers.download(item.url, fileName);
      }}>
        <View style={{
          height: 50,
          paddingHorizontal: 20,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#eee',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Text>{item.resolution || 'Audio'} ({item.encoding || item.audioEncoding}) </Text>
          <Text style={{ flexGrow: 1, textAlign: 'right', fontWeight: 'bold' }}>{item.container.toUpperCase()}</Text>
        </View>
      </TouchableNativeFeedback>
    )
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
        <View style={{ backgroundColor: '#f4f4f4', paddingHorizontal: 10, borderBottomColor: '#ddd', borderBottomWidth: StyleSheet.hairlineWidth }}>
          <TextInput
            returnKeyType="done"
            underlineColorAndroid="transparent"
            style={{ flexGrow: 1, fontSize: 24, color: '#666' }}
            placeholder="youtube.com/watch?v="
            onSubmitEditing={(e) => this.getVideoInfo(e.nativeEvent.text)} />
        </View>
        {this._renderVideoInfo()}
      </View >
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
