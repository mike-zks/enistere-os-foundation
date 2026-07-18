#!/usr/bin/env bash
# Mobile Core Flutter — Smoke runner
# Usage: bash scripts/smoke.sh [--android] [--ios]
#
# Without flags: runs unit + widget tests only (no device required).
# --android: also runs integration_test/ on an Android emulator.
# --ios:     also runs integration_test/ on an iOS simulator/device.
#
# Mirrors the pattern of starters/react-native smoke scripts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$(dirname "$SCRIPT_DIR")"
RUN_ANDROID=false
RUN_IOS=false

for arg in "$@"; do
  case "$arg" in
    --android) RUN_ANDROID=true ;;
    --ios)     RUN_IOS=true ;;
  esac
done

cd "$CORE_DIR"

echo "=== Mobile Core Flutter — Smoke ==="
echo "Flutter: $(flutter --version 2>&1 | head -1)"
echo ""

# --------------------------------------------------------------------------
echo "--- [1/3] flutter pub get"
flutter pub get
echo ""

# --------------------------------------------------------------------------
echo "--- [2/3] Unit + widget tests (flutter test)"
flutter test
echo ""

# --------------------------------------------------------------------------
echo "--- [3/3] Integration smoke tests"

if $RUN_ANDROID; then
  ANDROID_DEVICE=""
  # Prefer emulator-5554 (standard Enistere emulator) if present.
  if adb devices 2>/dev/null | grep -q "emulator-5554"; then
    ANDROID_DEVICE="emulator-5554"
  else
    # Fall back to first attached Android device.
    ANDROID_DEVICE="$(flutter devices 2>/dev/null \
      | grep android \
      | awk -F'•' '{print $2}' \
      | head -1 \
      | tr -d ' ')"
  fi

  if [ -z "$ANDROID_DEVICE" ]; then
    echo "BLOCKED: no Android device/emulator found."
    echo "Start an emulator with: flutter emulators --launch <name>"
    exit 1
  fi

  echo "Android device: $ANDROID_DEVICE"
  flutter test integration_test/ -d "$ANDROID_DEVICE"
  echo "PASSED: Android integration smoke"

elif $RUN_IOS; then
  IOS_DEVICE="$(flutter devices 2>/dev/null \
    | grep ios \
    | awk -F'•' '{print $2}' \
    | head -1 \
    | tr -d ' ')"

  if [ -z "$IOS_DEVICE" ]; then
    echo "BLOCKED: no iOS device/simulator found (requires macOS + Xcode)."
    exit 1
  fi

  echo "iOS device: $IOS_DEVICE"
  flutter test integration_test/ -d "$IOS_DEVICE"
  echo "PASSED: iOS integration smoke"

else
  echo "Skipped integration_test/ (no --android or --ios flag)."
  echo "To run on Android: bash scripts/smoke.sh --android"
  echo "To run on iOS:     bash scripts/smoke.sh --ios"
fi

echo ""
echo "=== Smoke complete ==="
