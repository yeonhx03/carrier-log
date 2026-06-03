package com.yeonhx03.carrierlog;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePrintPlugin.class);
        registerPlugin(NativeFileSavePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
