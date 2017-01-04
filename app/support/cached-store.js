import {AsyncStorage} from 'react-native';

var cache = {};

export default {
  get(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    return AsyncStorage.getItem(key).then((value) => {
      cache[key] = JSON.parse(value);
      return cache[key];
    });
  },
  set(key, value) {
    cache[key] = value;
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }
};