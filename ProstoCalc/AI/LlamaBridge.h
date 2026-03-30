#ifndef LlamaBridge_h
#define LlamaBridge_h

#import <Foundation/Foundation.h>

@interface LlamaBridge : NSObject

+ (instancetype)shared;
- (BOOL)loadModel:(NSString *)modelPath;
- (void)evaluatePrompt:(NSString *)prompt completion:(void(^)(NSString *response))completion;
- (void)stopInference;

@end

#endif /* LlamaBridge_h */
