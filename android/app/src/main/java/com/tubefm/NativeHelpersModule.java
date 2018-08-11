package com.tubefm;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Environment;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v7.app.NotificationCompat;
import android.text.format.Formatter;
import android.widget.Toast;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.api.client.googleapis.media.MediaHttpDownloader;
import com.google.api.client.googleapis.media.MediaHttpDownloaderProgressListener;
import com.google.api.client.googleapis.media.MediaHttpUploader;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;
import java.sql.Timestamp;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import fi.iki.elonen.NanoHTTPD;

import static android.content.Context.DOWNLOAD_SERVICE;
import static android.content.Context.WIFI_SERVICE;

public class NativeHelpersModule extends ReactContextBaseJavaModule {

    public NativeHelpersModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    public static final int MB = 0x100000;
    private static final AtomicInteger counter = new AtomicInteger();

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
    public void download(String url, String fileName) throws IOException {
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC);
        dir.mkdirs();
        File file = new File(dir, fileName);
        if (!file.exists()) {
            file.createNewFile();
        }
        OutputStream out = new FileOutputStream(file);
        MediaHttpDownloader downloader = new MediaHttpDownloader(new NetHttpTransport(), null);
        final NotificationManagerCompat notificationManager = NotificationManagerCompat.from(getReactApplicationContext());
        final NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(getReactApplicationContext());
        mBuilder.setContentTitle(fileName)
                .setSmallIcon(android.R.drawable.ic_notification_overlay)
                .setContentText("Starting");
        final int notificationId = counter.getAndIncrement();
        class CustomProgressListener implements MediaHttpDownloaderProgressListener {
            public void progressChanged(MediaHttpDownloader downloader) {
                switch (downloader.getDownloadState()) {
                    case MEDIA_IN_PROGRESS:
                        int progress = (int) Math.round(downloader.getProgress() * 100);
                        mBuilder.setProgress(100, progress, false);
                        notificationManager.notify(notificationId, mBuilder.build());
                        break;
                    case MEDIA_COMPLETE:
                        mBuilder.setContentText("Done")
                                .setProgress(0, 0, false);
                        notificationManager.notify(notificationId, mBuilder.build());
                }
            }
        }
        downloader.setProgressListener(new CustomProgressListener());
        downloader.setChunkSize(9 * MB);
        downloader.download(new GenericUrl(url), out);
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

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("MUSIC_DIR", getCurrentActivity().getExternalFilesDir(Environment.DIRECTORY_MUSIC).getAbsolutePath());
        return constants;
    }

    private String getDeviceIp() {
        WifiManager wifiManager = (WifiManager) getReactApplicationContext().getApplicationContext().getSystemService(WIFI_SERVICE);
        return Formatter.formatIpAddress(wifiManager.getConnectionInfo().getIpAddress());
    }

}
