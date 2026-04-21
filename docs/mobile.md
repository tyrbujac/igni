# Running Igni apps on mobile

`igni run` defaults to Chrome. Mobile targets — iOS simulator and Android emulator — are one command each.

## Commands

```bash
igni run                              # web (default, Chrome)
igni run ios                          # iOS simulator
igni run android                      # Android emulator
igni run ios --device "iPhone 17"     # target a specific iOS device by name or UDID
igni run android --device "Pixel 8a"  # same for Android
```

Target keyword goes first; `.igni` file second if you want to override `app.igni`:

```bash
igni run ios hello.igni               # run hello.igni on iOS
```

`--device <name>` can appear anywhere in the argv; it's matched against the device's name, UDID, or ID with case-insensitive substring search.

## Device selection

When the target is `ios` or `android`, Igni picks a device automatically:

- **Exactly one running device for the target platform** → used silently.
- **More than one running** → Igni errors with a list and asks for `--device "<name>"`. No surprise auto-pick.
- **No running device but an emulator exists** → Igni auto-boots the first available via `flutter emulators --launch <id>`, polls until it registers (up to 2 minutes), then runs.
- **No running device AND no emulator** → Igni errors and suggests installing one via Xcode / Android Studio.

When the target is `web`, Igni always uses Chrome; `--device` is rejected for web.

## Build timings (Apple Silicon)

- **iOS cold Xcode build:** ~40s on first run. Subsequent runs ~12–17s.
- **Android cold Gradle build:** ~2 min on first run. Subsequent runs sub-30s.
- **Hot reload** (`r` key) works identically on mobile and web.

## Flutter toolchain notes

Igni's `.igni/` hidden directory contains the generated Flutter project. Mobile targets require:

- **iOS:** Xcode installed. The first `igni run ios` invokes `flutter create . --platforms=ios` under the hood to add the iOS build configuration to the existing project.
- **Android:** Android SDK installed (easiest via Android Studio). The first `igni run android` does the same with `--platforms=android`. Debug manifest gets the standard `INTERNET` permission automatically.
- **Both:** `geolocator: ^13.0.1` is added to `pubspec.yaml` automatically when Igni detects a `locate()` call in source. iOS additionally needs `NSLocationWhenInUseUsageDescription` in `Info.plist` before `locate()` will prompt — not currently injected; on iOS `locate()` routes to `is error` until that's added manually. Tracked as ROADMAP Ideas item.

## Known gotchas

### Third-party APIs behind Cloudflare

Mobile Dart HTTP clients present a TLS fingerprint Cloudflare's bot scoring often challenges — so `fetch()` against a Cloudflare-protected public API (e.g. `jsonplaceholder.typicode.com`) can return HTTP 403 with an `Attention Required!` interstitial on iOS / Android, while the same URL returns HTTP 200 from a browser or `curl`. **Not an Igni-specific limitation** — any mobile Flutter / React Native app hitting a Cloudflare endpoint directly can reproduce it.

Workaround: proxy the request through a server you control, or target a non-Cloudflare endpoint. Igni's built-in `fetch.igni` example uses `api.github.com/users/octocat` (not Cloudflare) for this reason. Investigation trail in `docs/private/68` (gitignored).

### Screens without `title:` on iOS notch devices

Through v0.11.4, screens with no `title:` property (no AppBar) could clip their top content under the iPhone Dynamic Island. v0.11.5 fixes this — the codegen now wraps non-title Scaffold bodies in `SafeArea` automatically. Screens with `title:` were always fine because AppBar handles the inset internally. You shouldn't see clipping on any supported device after v0.11.5.

## Manual Flutter fallback

If you need more control than `igni run ios / android` provides (e.g. running on a physical device via USB, opening in Android Studio for native debugging), the `.igni/` directory is a normal Flutter project:

```bash
igni run                                   # to populate .igni/ from your .igni source
cd .igni
flutter create . --platforms=ios,android   # expand all platforms if not already
flutter devices                            # list all available
flutter run -d <device-id>                 # run on specific
```

The Igni CLI does this under the hood; shelling out directly just surfaces more Flutter knobs.
