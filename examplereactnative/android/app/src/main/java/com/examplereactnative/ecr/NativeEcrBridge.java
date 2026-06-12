package com.examplereactnative.ecr;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.examplereactnative.NativeEcrBridgeSpec;
import com.examplereactnative.ecr.models.PayNLService;
import com.examplereactnative.ecr.models.PayNLTransaction;
import com.examplereactnative.ecr.models.PosMessage;
import com.examplereactnative.ecr.models.PosTerminal;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.JsonObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

public class NativeEcrBridge extends NativeEcrBridgeSpec {
    private final String TAG = "NativeEcrBridge";
    private final DiscoveryManager discoveryManager;
    private final MessageManager messageManager;

    private final Handler discoveredHandler =
            new Handler(Looper.getMainLooper()) {
                @Override
                public void handleMessage(@NonNull Message msg) {
                    super.handleMessage(msg);

                    if (mEventEmitterCallback == null) {
                        Log.d(TAG, "eventEmitter function is null! Skipping SoftPosRnEvent event...");
                        return;
                    }

                    // Create map for packet
                    PosTerminal result = (PosTerminal) msg.obj;
                    WritableMap payload = Arguments.createMap();

                    payload.putString("sourceIp", result.sourceIp);
                    payload.putString("terminalCode", result.terminalCode);
                    payload.putString("terminalName", result.terminalName);
                    emitOnDiscovered(payload);
                }
            };

    private final Handler replyHandler =
            new Handler(Looper.getMainLooper()) {
                @Override
                public void handleMessage(@NonNull Message msg) {
                    super.handleMessage(msg);

                    if (mEventEmitterCallback == null) {
                        Log.d(TAG, "eventEmitter function is null! Skipping SoftPosRnEvent event...");
                        return;
                    }

                    JSONObject reply = (JSONObject) msg.obj;
                    // Create map for packet
                    WritableMap payload = Arguments.createMap();

                    Iterator<String> it = reply.keys();
                    while (it.hasNext()) {
                        String key = it.next();
                        try {
                            payload.putString(key, reply.getString(key));
                        } catch (JSONException e) {
                            Log.e(TAG, "Failed to get Json string element: " + e);
                        }
                    }

                    emitOnReply(payload);
                }
            };

    public NativeEcrBridge(ReactApplicationContext reactContext) {
        super(reactContext);

        discoveryManager = new DiscoveryManager(discoveredHandler);
        messageManager = new MessageManager(replyHandler);
    }

    @Override
    public void start() { }

    @Override
    public boolean getIsDiscovering() {
        return discoveryManager.isDiscovering();
    }

    @Override
    public void startDiscovering(Promise promise) {
        discoveryManager.startDiscovery();
        promise.resolve(null);
    }

    @Override
    public void stopDiscovering(Promise promise) {
        discoveryManager.stopDiscovery();
        promise.resolve(null);
    }

    @Nullable
    @Override
    public WritableMap getStatus() {
        PosTerminal terminal = messageManager.getStatus();
        if (terminal == null) {
            return null;
        }

        WritableMap payload = Arguments.createMap();
        payload.putString("sourceIp", terminal.sourceIp);
        payload.putString("terminalCode", terminal.terminalCode);
        payload.putString("terminalName", terminal.terminalName);

        return payload;
    }

    @Override
    public void connect(ReadableMap to, Promise promise) {
        PosTerminal terminal = new PosTerminal();
        terminal.sourceIp = to.getString("sourceIp");
        terminal.terminalCode = to.getString("terminalCode");
        terminal.terminalName = to.getString("terminalName");

        messageManager.connect(terminal, promise);
    }

    @Override
    public void disconnect(Promise promise) {
        messageManager.disconnect();
        promise.resolve(null);
    }

    @Override
    public void sendMessage(ReadableMap message, Promise promise) {
        PayNLService service = null;
        if (message.hasKey("service")) {
            ReadableMap serviceMap = message.getMap("service");
            service = new PayNLService(
                    serviceMap.getString("serviceId"),
                    serviceMap.getString("secret")
            );
        }

        PayNLTransaction transaction = null;
        if (message.hasKey("transaction")) {
            transaction = PayNLTransaction.parseTransaction(message.getMap("transaction"));
        }

        PosMessage posMessage = new PosMessage(
                message.getString("type"),
                transaction,
                service,
                message.getString("needle")
        );
        messageManager.send(posMessage);
        promise.resolve(null);
    }
}
