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
    this.download(e.videoId);
  }

  _renderVideoInfo = () => {
    if (this.state.loading) return (
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    );
    if (!this.state.info) return null;
    return (
      <FlatList
        style={{ flexGrow: 1 }}
        keyExtractor={(i) => i.itag}
        data={this.state.info.formats}
        renderItem={this._renderRow}
      />
    );
  }

  _renderRow = ({ item }) => (
    <View>
      <Text>{item.resolution} {item.container}</Text>
    </View>
  )

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
            defaultValue="qr1Fpkkad2c"
            returnKeyType="done"
            underlineColorAndroid="transparent"
            style={{ flexGrow: 1, fontSize: 24, color: '#666' }}
            placeholder="youtube.com/watch?v="
            onSubmitEditing={(e) => this.download(e.nativeEvent.text)} />
        </View>
        {this._renderVideoInfo()}
      </View>
    );
  }

  download(videoId) {
    this.setState({ loading: true });
    getInfo(`https://www.youtube.com/watch?v=${videoId}`, (error, info) => {
      if (error) {
        alert(error);
        this.setState({ loading: false });
        return;
      }
      console.log(info.formats);
      this.setState({ info: info, loading: false });
    });
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
