#import "RCTNativeEcrBridge.h"
#import "EcrEventEmitter.h"

@implementation EcrEventEmitter

+ (void)emitOnDiscovery:(NSDictionary *)value {
  [[RCTNativeEcrBridge shared] emitOnDiscovered:value];
}

+ (void)emitOnReply:(NSDictionary *)value {
  [[RCTNativeEcrBridge shared] emitOnReply:value];
}

@end
