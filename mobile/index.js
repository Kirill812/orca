// Must run before any screen module: it decides the colour palette.
import './src/theme/color-scheme-boot'
// Headless notification launches do not mount the router layout.
import './src/notifications/push-background-dismissal'
import 'expo-router/entry'
