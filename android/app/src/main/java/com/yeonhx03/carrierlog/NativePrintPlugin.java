package com.yeonhx03.carrierlog;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {
    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        String jobName = call.getString("jobName", "Carrier Log");

        if (html == null || html.isEmpty()) {
            call.reject("출력할 내용이 없습니다.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            WebView printWebView = new WebView(getContext());

            printWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    PrintManager printManager =
                        (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);

                    if (printManager == null) {
                        call.reject("Android 인쇄 서비스를 사용할 수 없습니다.");
                        return;
                    }

                    PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                        .build();

                    printManager.print(jobName, view.createPrintDocumentAdapter(jobName), attributes);
                    call.resolve(new JSObject());
                }
            });

            printWebView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
        });
    }
}
