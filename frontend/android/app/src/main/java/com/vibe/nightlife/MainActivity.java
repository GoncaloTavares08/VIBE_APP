package com.vibe.nightlife;

import android.graphics.Color;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Status/navigation bar style itself is handled by the SystemBars
        // plugin (configured in capacitor.config.ts, style: 'DARK') — it runs
        // after onCreate and would override any manual WindowInsetsController
        // calls made here. This just sets the window's own background so
        // there's no light flash before the plugin/WebView paint.
        int background = Color.parseColor("#0a0a0a");
        getWindow().setStatusBarColor(background);
        getWindow().setNavigationBarColor(background);
        getWindow().getDecorView().setBackgroundColor(background);
    }
}
