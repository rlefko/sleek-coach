// Jest setup file

// Set React Native globals
global.__DEV__ = true;

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Storage mock is configured via moduleNameMapper in jest.config.js
// pointing to __mocks__/storage.js

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      key: 'test-route-key',
      name: 'TestScreen',
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Mock NetInfo for offline sync testing
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg', width: 100, height: 100 }],
    })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg', width: 100, height: 100 }],
    })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-document.csv', name: 'test.csv', size: 1000 }],
    })
  ),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('file content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  documentDirectory: 'file://documents/',
  cacheDirectory: 'file://cache/',
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((array) => {
    // Fill the array with pseudo-random values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  }),
  randomUUID: jest.fn(() => 'test-uuid-1234-5678-9abc-def012345678'),
  digestStringAsync: jest.fn(() => Promise.resolve('mock-hash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
    SHA512: 'SHA-512',
    MD5: 'MD5',
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

// Mock react-native-paper with minimal implementation
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, TextInput, Pressable } = require('react-native');

  // Basic theme object
  const theme = {
    colors: {
      primary: '#6200ee',
      onPrimary: '#ffffff',
      primaryContainer: '#e8def8',
      onPrimaryContainer: '#21005d',
      secondary: '#625b71',
      onSecondary: '#ffffff',
      surface: '#fffbfe',
      surfaceVariant: '#e7e0ec',
      onSurface: '#1c1b1f',
      onSurfaceVariant: '#49454f',
      outline: '#79747e',
      error: '#b3261e',
      errorContainer: '#f9dedc',
      onErrorContainer: '#410e0b',
      surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
      onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
    },
  };

  const MockText = ({ children, variant, style, onPress, ...props }) =>
    React.createElement(Text, { style, onPress, ...props }, children);

  const MockTextInput = React.forwardRef(({ mode, label, error, style, ...props }, ref) =>
    React.createElement(View, null,
      label && React.createElement(Text, null, label),
      React.createElement(TextInput, { ref, style, ...props })
    )
  );

  const MockIconButton = ({ icon, onPress, disabled, iconColor, size, style, mode }) =>
    React.createElement(Pressable, { onPress, disabled, style, testID: `icon-${icon}` },
      React.createElement(Text, null, icon)
    );

  const MockButton = ({ children, onPress, disabled, mode, style }) =>
    React.createElement(Pressable, { onPress, disabled, style },
      React.createElement(Text, null, children)
    );

  const MockHelperText = ({ children, type, visible }) =>
    visible ? React.createElement(Text, null, children) : null;

  const MockSegmentedButtons = ({ value, onValueChange, buttons, style, density }) =>
    React.createElement(View, { style },
      buttons.map((btn) =>
        React.createElement(Pressable, {
          key: btn.value,
          onPress: () => onValueChange(btn.value),
          testID: `segment-${btn.value}`,
        },
          React.createElement(Text, null, btn.label)
        )
      )
    );

  const MockBanner = ({ children, visible, icon, style }) =>
    visible ? React.createElement(View, { style }, children) : null;

  const MockCheckbox = ({ status, onPress, color }) =>
    React.createElement(Pressable, { onPress, testID: 'checkbox' },
      React.createElement(Text, null, status === 'checked' ? '☑' : '☐')
    );

  const MockSnackbar = ({ children, visible, onDismiss }) =>
    visible ? React.createElement(View, { testID: 'snackbar' },
      React.createElement(Text, null, children)
    ) : null;

  const MockCard = ({ children, style, mode }) =>
    React.createElement(View, { style }, children);

  const MockActivityIndicator = ({ animating, color, size }) =>
    animating ? React.createElement(Text, null, 'Loading...') : null;

  return {
    MD3DarkTheme: theme,
    MD3LightTheme: theme,
    PaperProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useTheme: () => theme,
    Text: MockText,
    TextInput: MockTextInput,
    IconButton: MockIconButton,
    Button: MockButton,
    HelperText: MockHelperText,
    SegmentedButtons: MockSegmentedButtons,
    Banner: MockBanner,
    Checkbox: { Android: MockCheckbox, Item: MockCheckbox },
    Snackbar: MockSnackbar,
    Card: MockCard,
    ActivityIndicator: MockActivityIndicator,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, style, edges }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  ScrollView: 'ScrollView',
  Slider: 'Slider',
  Switch: 'Switch',
  TextInput: 'TextInput',
  ToolbarAndroid: 'ToolbarAndroid',
  ViewPagerAndroid: 'ViewPagerAndroid',
  DrawerLayoutAndroid: 'DrawerLayoutAndroid',
  WebView: 'WebView',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  PanGestureHandler: 'PanGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  RawButton: 'RawButton',
  BaseButton: 'BaseButton',
  RectButton: 'RectButton',
  BorderlessButton: 'BorderlessButton',
  TouchableHighlight: 'TouchableHighlight',
  TouchableNativeFeedback: 'TouchableNativeFeedback',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Directions: {},
  gestureHandlerRootHOC: (component) => component,
}));

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') ||
      args[0].includes('componentWillReceiveProps') ||
      args[0].includes('componentWillMount') ||
      args[0].includes('useNativeDriver'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Silence specific console errors in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalError(...args);
};
