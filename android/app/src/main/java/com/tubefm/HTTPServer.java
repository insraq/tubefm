package com.tubefm;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import fi.iki.elonen.NanoHTTPD;

public class HTTPServer extends NanoHTTPD {

  private static final String html = "<html>" +
    "<head>" +
    "  <title>TubeFM</title>" +
    "  <style>body { font-family: sans-serif; }</style>" +
    "</head>" +
    "<body>" +
    "<form action='?' method='get'>" +
    "  <h1>TubeFM</h1>" +
    "  youtube.com/watch?v=" +
    "  <input maxlength='11' type='text' name='videoId'>" +
    "  <input type='submit' value='Add'>" +
    "</form>" +
    "</body>" +
    "</html>";

  private static DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter;
  private static HTTPServer instance = null;


  protected HTTPServer(int port, DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter) {
    super(port);
    this.eventEmitter = eventEmitter;
  }

  public static HTTPServer getInstance(DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter) {
    if(instance == null) {
      instance = new HTTPServer(8765, eventEmitter);
    } else {
      instance.setEventEmitter(eventEmitter);
    }
    return instance;
  }

  public static void setEventEmitter(DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter) {
    HTTPServer.eventEmitter = eventEmitter;
  }

  @Override
  public Response serve(IHTTPSession session) {
    String videoId = session.getParms().get("videoId");
    if (videoId != null) {
      WritableMap params = Arguments.createMap();
      params.putString("videoId", videoId);
      eventEmitter.emit("videoIdAdded", params);
    }
    return newFixedLengthResponse(html);
  }
}
