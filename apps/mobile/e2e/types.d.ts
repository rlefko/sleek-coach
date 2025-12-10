// Detox type declarations for E2E tests
declare module 'detox' {
  export const device: {
    launchApp: (options?: { newInstance?: boolean }) => Promise<void>;
    reloadReactNative: () => Promise<void>;
    setURLBlacklist: (urls: string[]) => Promise<void>;
  };

  export const element: (matcher: Detox.Matcher) => Detox.Element;

  export const by: {
    id: (id: string) => Detox.Matcher;
    text: (text: string | RegExp) => Detox.Matcher;
    label: (label: string) => Detox.Matcher;
    type: (type: string) => Detox.Matcher;
    traits: (traits: string[]) => Detox.Matcher;
  };

  export const expect: (element: Detox.Element) => Detox.Expect;

  export const waitFor: (element: Detox.Element) => Detox.WaitFor;

  namespace Detox {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Matcher {}

    interface Element {
      tap: () => Promise<void>;
      typeText: (text: string) => Promise<void>;
      replaceText: (text: string) => Promise<void>;
      clearText: () => Promise<void>;
      scroll: (pixels: number, direction: 'up' | 'down' | 'left' | 'right') => Promise<void>;
      atIndex: (index: number) => Element;
    }

    interface Expect {
      toBeVisible: () => Promise<void>;
      toExist: () => Promise<void>;
      toHaveText: (text: string) => Promise<void>;
      toHaveId: (id: string) => Promise<void>;
      not: Expect;
    }

    interface WaitFor {
      toBeVisible: () => WaitFor;
      toExist: () => WaitFor;
      withTimeout: (ms: number) => Promise<void>;
    }
  }
}
