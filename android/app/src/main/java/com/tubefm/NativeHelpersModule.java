package com.tubefm;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.IOException;

import fi.iki.elonen.NanoHTTPD;

import static android.content.Context.WIFI_SERVICE;

public class NativeHelpersModule extends ReactContextBaseJavaModule {

  public NativeHelpersModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "NativeHelpers";
  }

  @ReactMethod
  public void playAudio(String url, Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }
    try {
      Activity currentActivity = getCurrentActivity();
      Intent intent = new Intent(Intent.ACTION_VIEW);
      File file = new File(url);
      intent.setDataAndType(Uri.fromFile(file), "audio/*");
      if (currentActivity != null) {
        currentActivity.startActivity(intent);
      } else {
        getReactApplicationContext().startActivity(intent);
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(new JSApplicationIllegalArgumentException(
        "Could not open URL '" + url + "': " + e.getMessage()));
    }
  }

  @ReactMethod
  public void startServer(Promise promise) {
    WritableMap params = Arguments.createMap();
    params.putString("ip", getDeviceIp());
    HTTPServer server = HTTPServer.getInstance(getEventEmitter());
    try {
      server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
      promise.resolve(params);
    } catch (IOException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void stopServer() {
    HTTPServer.getInstance(getEventEmitter()).stop();
  }

  private DeviceEventManagerModule.RCTDeviceEventEmitter getEventEmitter() {
    return getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
  }

  private String getDeviceIp() {
    WifiManager wifiManager = (WifiManager) getReactApplicationContext().getApplicationContext().getSystemService(WIFI_SERVICE);
    return Formatter.formatIpAddress(wifiManager.getConnectionInfo().getIpAddress());
  }

}
