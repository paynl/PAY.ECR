#import "RCTNativeEcrBridge.h"

static RCTNativeEcrBridge* ecrBridge;

@implementation RCTNativeEcrBridge

+ (NSString *)moduleName { 
  return @"NativeEcrBridge";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params { 
  return std::make_shared<facebook::react::NativeEcrBridgeSpecJSI>(params);
}

+ (instancetype)shared {
  return ecrBridge;
}

- (void)start {
  ecrBridge = self;
}

- (nonnull NSNumber *)getIsDiscovering { 
  return [[EcrBridgeService shared] getIsDiscovering];
}

- (void)startDiscovering:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  [[EcrBridgeService shared] startDiscovery:resolve rejecter:reject];
}


- (void)stopDiscovering:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject { 
  [[EcrBridgeService shared] stopDiscovery:resolve rejecter:reject];
}

- (void)connect:(JS::NativeEcrBridge::PosTerminal &)to resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  NSDictionary *terminal = @{
    @"sourceIp": to.sourceIp(),
    @"terminalName": to.terminalName(),
    @"terminalCode": to.terminalCode()
  };
  
  [[EcrBridgeService shared] connectWithTerminal:terminal resolver:resolve rejecter:reject];
}


- (void)disconnect:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject { 
  [[EcrBridgeService shared] disconnect:resolve rejecter:reject];
}


- (NSDictionary * _Nullable)getStatus { 
  return NULL;
}


- (void)sendMessage:(nonnull NSDictionary *)message resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject { 
  [[EcrBridgeService shared] sendMessageWithData:message resolver:resolve rejecter:reject];
}

@end
