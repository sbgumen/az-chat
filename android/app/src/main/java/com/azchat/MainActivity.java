package com.azchat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import cn.jiguang.api.utils.JCollectionAuth;
import cn.jpush.android.api.JPushInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int FILE_CHOOSER_REQUEST = 100;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean webViewConfigured = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;

        // 极光隐私合规授权（必须在 init 之前调用）
        JCollectionAuth.setAuth(this, true);

        // 创建通知渠道（Android 8+）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("messages", "消息通知", NotificationManager.IMPORTANCE_HIGH);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }

        // 初始化极光推送
        JPushInterface.setDebugMode(false);
        JPushInterface.init(this);

        // 申请系统权限
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.POST_NOTIFICATIONS,
            }, 1);
        } else {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.RECORD_AUDIO,
            }, 1);
        }
    }

    public static MainActivity instance;

    public static void onJPushRegId(String regId) {
        if (regId == null || regId.isEmpty() || instance == null) return;
        WebView webView = instance.getBridge().getWebView();
        webView.post(() -> webView.evaluateJavascript(
            "window.jpushRegId = '" + regId + "';" +
            "window.dispatchEvent(new CustomEvent('jpush-registration', {detail: '" + regId + "'}));",
            null
        ));
    }

    @Override
    public void onResume() {
        super.onResume();
        JPushInterface.onResume(this);
        if (webViewConfigured) return;
        webViewConfigured = true;

        WebView webView = getBridge().getWebView();
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public boolean onShowFileChooser(WebView wv, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                startActivityForResult(Intent.createChooser(intent, "选择图片"), FILE_CHOOSER_REQUEST);
                return true;
            }
        });

        // 获取极光 Registration ID 并传给前端（延迟确保 WebView 已加载）
        String regId = JPushInterface.getRegistrationID(this);
        if (regId != null && !regId.isEmpty()) {
            final String finalRegId = regId;
            // 存到全局变量，前端可通过 window.jpushRegId 读取
            webView.post(() -> webView.evaluateJavascript(
                "window.jpushRegId = '" + finalRegId + "';" +
                "window.dispatchEvent(new CustomEvent('jpush-registration', {detail: '" + finalRegId + "'}));",
                null
            ));
            // 延迟再发一次，确保前端监听器已注册
            webView.postDelayed(() -> webView.evaluateJavascript(
                "window.jpushRegId = '" + finalRegId + "';" +
                "window.dispatchEvent(new CustomEvent('jpush-registration', {detail: '" + finalRegId + "'}));",
                null
            ), 3000);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        JPushInterface.onPause(this);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri uri = data.getData();
                if (uri != null) results = new Uri[]{uri};
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }
}
