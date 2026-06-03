package com.yeonhx03.carrierlog;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

@CapacitorPlugin(name = "NativeFileSave")
public class NativeFileSavePlugin extends Plugin {
    @PluginMethod
    public void saveFile(PluginCall call) {
        String filename = call.getString("filename", "carrier-log.xls");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        startActivityForResult(call, intent, "saveFileResult");
    }

    @ActivityCallback
    private void saveFileResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("파일 저장이 취소되었습니다.");
            return;
        }

        Uri uri = result.getData().getData();
        String data = call.getString("data");

        if (uri == null || data == null) {
            call.reject("저장할 파일 정보를 확인할 수 없습니다.");
            return;
        }

        try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri)) {
            if (outputStream == null) {
                call.reject("파일을 열 수 없습니다.");
                return;
            }

            outputStream.write(Base64.decode(data, Base64.DEFAULT));
            outputStream.flush();

            JSObject response = new JSObject();
            response.put("uri", uri.toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject("파일을 저장할 수 없습니다.", error);
        }
    }
}
