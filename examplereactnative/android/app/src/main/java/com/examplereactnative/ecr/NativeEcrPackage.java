package com.examplereactnative.ecr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

public class NativeEcrPackage extends BaseReactPackage {
    @Nullable
    @Override
    public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext reactContext) {
        if (name.equals(NativeEcrBridge.NAME)) {
            return new NativeEcrBridge(reactContext);
        } else {
            return null;
        }
    }

    @NonNull
    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return new ReactModuleInfoProvider() {
            @NonNull
            @Override
            public Map<String, ReactModuleInfo> getReactModuleInfos() {
                Map<String, ReactModuleInfo> map = new HashMap<>();
                map.put(
                        NativeEcrBridge.NAME,
                        new ReactModuleInfo(
                                NativeEcrBridge.NAME, // name
                                NativeEcrBridge.NAME, // className
                                false, // canOverrideExistingModule
                                true, // needsEagerInit
                                false, // isCXXModule
                                true // isTurboModule
                        ));
                return map;
            }
        };
    }
}
