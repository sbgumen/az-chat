package com.azchat;

import android.content.Context;
import cn.jpush.android.api.CustomMessage;
import cn.jpush.android.api.NotificationMessage;
import cn.jpush.android.service.JPushMessageReceiver;
import cn.jpush.android.api.JPushMessage;
import cn.jpush.android.api.JPushInterface;
import org.json.JSONObject;

public class MyJPushReceiver extends JPushMessageReceiver {

    @Override
    public void onRegister(Context context, String registrationId) {
        MainActivity.onJPushRegId(registrationId);
    }

    @Override
    public void onConnected(Context context, boolean isConnected) {}

    @Override
    public void onNotifyMessageOpened(Context context, NotificationMessage message) {
        // 将推送点击事件传递给 WebView 前端处理跳转
        try {
            JSONObject data = new JSONObject();
            data.put("type", message.notificationExtras != null ? message.notificationExtras : "");
            data.put("extras", message.notificationExtras != null ? new JSONObject(message.notificationExtras).toString() : "{}");
            data.put("title", message.notificationTitle != null ? message.notificationTitle : "");
            final String js = "window.dispatchEvent(new CustomEvent('push-notification-opened', {detail: " + data.toString() + "}));";
            if (MainActivity.instance != null) {
                MainActivity.instance.getBridge().getWebView().post(() ->
                    MainActivity.instance.getBridge().getWebView().evaluateJavascript(js, null)
                );
            }
        } catch (Exception e) {
            android.widget.Toast.makeText(context, "通知被点击: " + message.notificationTitle, android.widget.Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onMessage(Context context, CustomMessage customMessage) {}

    @Override
    public void onTagOperatorResult(Context context, JPushMessage jPushMessage) {}

    @Override
    public void onAliasOperatorResult(Context context, JPushMessage jPushMessage) {}
}
