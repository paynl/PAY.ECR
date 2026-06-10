#import <Foundation/Foundation.h>

@interface EcrEventEmitter : NSObject

+ (void) emitOnDiscovery:(NSDictionary *)value;
+ (void) emitOnReply:(NSDictionary *)value;

@end

