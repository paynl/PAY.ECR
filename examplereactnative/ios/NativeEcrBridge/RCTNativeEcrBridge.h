#import <PosEcrSpec/PosEcrSpec.h>
#import <React/RCTEventEmitter.h>
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "examplereactnative-Swift.h"

@interface RCTNativeEcrBridge: NativeEcrBridgeSpecBase <NativeEcrBridgeSpec>

+ (instancetype)shared;

@end
