# माँ मनोकामना स्मॉल फाइनेंस — Android build project

This is a fresh Android WebView wrapper around the supplied web app. It is configured to build a debug APK using GitHub Actions.

## Build the APK
1. Upload the contents of this folder to a new GitHub repository.
2. Open the repository's **Actions** tab.
3. Select **Build Android APK** and press **Run workflow** (or push to `main`).
4. Open the completed workflow run and download the artifact named `maa-manokamna-small-finance-apk`.
5. Extract the artifact to get `app-debug.apk`, then install it on your Android phone. If Android asks, allow installation from that source.

## Notes
- This project wrapper does not mean an APK has already been compiled in this environment.
- The web app currently stores data locally in the browser/WebView; online sync and cloud backup need a backend.
- This is a debug APK for testing, not a Play Store release build.
