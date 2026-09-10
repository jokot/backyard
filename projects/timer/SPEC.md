# Kitchen Timer — Web Page Spec

A kitchen countdown timer as a single web page. Everything lives in one self-contained `index.html`: plain HTML, CSS, and JavaScript only — no frameworks, no CDN links, no external fonts or images, no build step, and no network requests of any kind. Opening the file directly in a browser via `file://` is the primary way it runs and must work with no server and no console errors.

## File Layout

```
kitchen-timer/
├── SPEC.md       # This spec
└── index.html    # The entire page: markup, styles, and all logic in one file
```

## Page States

The page is a four-state machine; exactly one state at a time. Control states per state:

| State    | Minutes/Seconds inputs | Start    | Pause button        | Reset    |
|----------|------------------------|----------|---------------------|----------|
| `idle`   | editable               | enabled  | disabled, "Pause"   | disabled |
| `running`| disabled               | disabled | enabled, "Pause"    | enabled  |
| `paused` | disabled               | disabled | enabled, "Resume"   | enabled  |
| `finished`| disabled              | enabled  | disabled            | enabled  |

Transitions: `idle → running` (Start), `running → paused` (Pause), `paused → running` (Resume), `running → finished` (countdown reaches zero), and `running | paused | finished → idle` (Reset).

## Timer Input

- Two number inputs side by side, labelled "Minutes" and "Seconds": Minutes has min 0, max 99, step 1, default 0; Seconds has min 0, max 59, step 1, default 0.
- On Start, read both values, round each down to an integer, clamp to its min/max, and compute total duration = minutes × 60 + seconds, in whole seconds. Maximum possible duration is 99:59.
- If the total is 0, show the message "Set a time greater than zero." directly under the inputs and do not start. The message clears on the next input change or Start press.
- The duration is captured once at Start. Changing the inputs afterwards has no effect on a running or paused countdown (the inputs are disabled anyway).
- In `idle`, the display always mirrors the current input values as mm:ss and updates live on every input event.

## Buttons

- **Start** — applies the Timer Input rules. If total > 0: capture the duration, set `target = Date.now() + total × 1000`, enter `running`, and start ticking.
- **Pause / Resume** — one button with two labels. In `running`, Pause freezes the countdown: store `remainingMs = target − Date.now()`, clear the tick interval, relabel the button "Resume", enter `paused`. In `paused`, Resume restarts: set `target = Date.now() + remainingMs`, restart the tick interval, relabel "Pause", enter `running`. Pausing never loses a second: the displayed value on Resume is exactly the value shown when Paused, and paused time never counts down.
- **Reset** — from any non-idle state, clear the tick interval, remove the finished banner, enter `idle`, and restore: inputs re-enabled keeping their last entered values, display showing those values as mm:ss, Pause button relabelled "Pause" and disabled, Start enabled, Reset disabled.

## Display and Ticking

- One large monospace display, format `mm:ss` — two digits each, zero-padded (05:00, 00:47, 99:59). Because inputs are capped, the display is always exactly five characters and never shows 100 minutes or 60 seconds.
- The displayed second count is `Math.ceil(remainingMs / 1000)`, floored at 0. A 90-second timer therefore reads 01:30 for the first full second, then 01:29, …, 00:01, and 00:00 when finished.
- While `running`, a `setInterval` fires every 200 ms, recomputes `remainingMs = target − Date.now()`, and rewrites the display text only when the mm:ss string differs from the last rendered string — exactly one visual update per second, with no drift from interval jitter.
- Count down from a target timestamp; never decrement a stored counter per tick. This keeps the countdown accurate even when the tab is throttled.
- The browser tab title mirrors the display: `"mm:ss — Kitchen Timer"` while running or paused, `"Time's up! — Kitchen Timer"` when finished, `"Kitchen Timer"` in idle.

## Finished State

- When a tick finds `remainingMs ≤ 0`: clear the interval immediately and enter `finished`.
- The display reads 00:00, drawn in the alert colour.
- A bold banner appears directly under the display: "Time's up!" — at least 24 px, bold, alert colour, so the finished state is obvious from across a kitchen.
- No sound and no browser notification are used.
- From `finished`, Start begins a fresh countdown of the entered duration, and Reset returns to `idle`.

## Layout and Styling

One centred column on a plain light background (`#FAFAFA`); no images, no web fonts — system font stack throughout. Order top to bottom: heading "Kitchen Timer", the display, the finished banner (hidden unless finished), the Minutes/Seconds inputs with labels in one row, the error message line (hidden unless the zero-duration message is showing), and the three buttons in one row. Buttons are default-styled with a 20 px font; disabled controls render at 50% opacity.

| Constant             | Value     | Meaning                                  |
|----------------------|-----------|------------------------------------------|
| TICK_MS              | 200       | Tick interval while running (ms)         |
| MAX_MINUTES          | 99        | Minutes input cap                        |
| MAX_SECONDS          | 59        | Seconds input cap                        |
| DISPLAY_FONT_SIZE    | 72px      | mm:ss display size                       |
| BANNER_FONT_SIZE     | 24px      | Finished banner size                     |
| COLOR_BG             | `#FAFAFA` | Page background                          |
| COLOR_TEXT           | `#1B1F24` | Display text colour (normal states)      |
| COLOR_ALERT          | `#C62828` | Display and banner colour when finished  |

## Out of Scope

Sound or beeps, browser notifications, multiple simultaneous timers, preset or quick-add buttons, persistence across reloads, keyboard shortcuts, dark mode, mobile-specific layout, frameworks or libraries of any kind.

## Acceptance Criteria

1. [ ] `index.html` opened directly via `file://` runs with no console errors and makes no network requests; the file references no external resources of any kind.
2. [ ] Entering 1:30 and pressing Start counts down 01:30 → 01:29 → … → 00:01 → 00:00, visibly updating once per second.
3. [ ] Start with both inputs at 0 shows "Set a time greater than zero." and does not start; the message clears on the next input change or Start press.
4. [ ] While running, Pause freezes the display; Resume continues from the frozen second; the button reads "Pause" while running and "Resume" while paused.
5. [ ] Pausing for 10 seconds and resuming delays the finish by exactly those 10 seconds — paused time never counts down.
6. [ ] Reset from any state returns to `idle`: inputs re-enabled with their previous values, display restored to that duration, banner cleared, Pause disabled and labelled "Pause".
7. [ ] Inputs are disabled while running or paused and re-enabled on Reset.
8. [ ] Reaching zero shows 00:00 in the alert colour with the "Time's up!" banner, and the tab title reads "Time's up! — Kitchen Timer".
9. [ ] The display is always exactly `mm:ss`, zero-padded and monospaced, and never shows 100 minutes or 60 seconds.
10. [ ] `python3 -m http.server 8000` in the project directory serves the page: `curl -sI` on the local URL and on the ngrok public URL for port 8000 each returns HTTP 200.
