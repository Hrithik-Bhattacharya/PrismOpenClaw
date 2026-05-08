# M2 Action Mapping

This document defines the exact action-to-ADB command contract for the M2 Android execution module.

## Supported ADB Actions

| Action Key | ADB Command |
|-----------|-------------|
| `enable_dnd` | `adb shell settings put global zen_mode 1` |
| `disable_dnd` | `adb shell settings put global zen_mode 0` |
| `mute_notifications` | `adb shell settings put global notification_sound ""` |
| `enable_focus` | `adb shell am start -a android.intent.action.MAIN -n com.android.settings/.Settings` |
| `open_calendar` | `adb shell am start -a android.intent.action.VIEW -d content://com.android.calendar/events` |
| `mute_social_apps` | `adb shell pm disable-user --user 0 com.instagram.android` |
| `block_notifications` | `adb shell settings put global heads_up_notifications_enabled 0` |
| `set_brightness_high` | `adb shell settings put system screen_brightness 200` |
| `reduce_notifications` | `adb shell settings put global heads_up_notifications_enabled 0` |
| `set_brightness_low` | `adb shell settings put system screen_brightness 30` |
| `enable_night_mode` | `adb shell settings put secure ui_night_mode 2` |
| `open_meditation_app` | `adb shell am start -a android.intent.action.MAIN -n com.calm.android/.MainActivity` |
| `play_ambient_sound` | `adb shell am broadcast -a android.media.VOLUME_CHANGED_ACTION` |
| `open_fitness_app` | `adb shell am start -a android.intent.action.MAIN -n com.google.android.apps.fitness/.MainActivity` |
| `enable_screen_on` | `adb shell settings put system screen_off_timeout 600000` |
| `start_activity_track` | `adb shell am broadcast -a com.fitness.START_TRACKING` |
| `silence_all` | `adb shell settings put global ringer_mode 0` |
| `enable_night_filter` | `adb shell settings put secure accessibility_display_daltonizer_enabled 1` |
| `set_brightness_min` | `adb shell settings put system screen_brightness 0` |
| `enable_power_saver` | `adb shell settings put global low_power 1` |
| `reduce_updates` | `adb shell settings put global wifi_scan_interval_background_s 300` |
| `disable_animations` | `adb shell settings put global window_animation_scale 0` |
| `enable_notifications` | `adb shell settings put global heads_up_notifications_enabled 1` |
| `open_messaging` | `adb shell am start -a android.intent.action.MAIN -c android.intent.category.APP_MESSAGING` |

## Persona Action Bundles

These are the example groups that M1 may send for each persona.

- `work`: `enable_dnd`, `open_calendar`, `mute_social_apps`, `set_brightness_high`
- `fitness`: `open_fitness_app`, `enable_screen_on`, `disable_dnd`, `start_activity_track`
- `calm`: `reduce_notifications`, `set_brightness_low`, `enable_night_mode`, `open_meditation_app`
- `focus`: `block_notifications`, `enable_dnd`, `disable_animations`
- `sleep`: `silence_all`, `enable_night_filter`, `set_brightness_min`, `enable_night_mode`
- `power_saver`: `enable_power_saver`, `reduce_updates`, `disable_animations`
- `social`: `enable_notifications`, `open_messaging`, `disable_dnd`
- `learning`: `enable_dnd`, `set_brightness_high`, `mute_social_apps`

## Notes

- M2 does not make decisions. It only executes actions received from M1.
- Unknown action keys are logged as warnings.
- If you need to add new persona actions, add the mapping here and update `index.js`.
