# Stress Test Plan

Use this checklist to stress the app after changes to matching, WebSockets, or the UI.

## Test Setup

- Run the backend from `Backend/`.
- Run the frontend from `frontend/`.
- Open the app in two or more browser windows or incognito sessions.
- Keep browser devtools open to watch WebSocket and console output.

## Baseline Flow

1. Open the app in two windows.
2. Start a call in both windows.
3. Confirm both users match.
4. Speak briefly and verify audio activity indicators respond.
5. End the call from one window and confirm the other window transitions back cleanly.

## Load Scenarios

- Open 5 to 10 sessions and trigger matching at the same time.
- Repeatedly press Skip on one client while another client joins and leaves.
- Refresh a client during a call and confirm the other side receives the disconnect state.
- Toggle mute/unmute rapidly for 30 seconds and confirm the UI stays responsive.
- Leave one client idle in the waiting state while other clients keep matching and disconnecting.

## Failure Scenarios

- Turn off the backend after a call starts and confirm the frontend shows a connection error.
- Block microphone permissions and confirm the UI surfaces the failure.
- Close a tab without ending the call and confirm the partner is released back to the queue.
- Open the app from a slow network connection and confirm the loading state still completes.

## What To Watch

- Matching latency from start call to connected state.
- Response time for each key action: start call, skip, disconnect, reconnect, and message delivery.
- Throughput under load: how many match attempts, skips, and reconnects the system can handle per minute without errors.
- WebSocket reconnect behavior.
- Whether one disconnect leaves stale match state behind.
- CPU usage during rapid mute, skip, and reconnect actions.
- Console errors in both browser windows and the backend terminal.

## Pass Criteria

- No uncaught frontend errors.
- No backend exceptions during matching or disconnects.
- Response times remain stable during repeated load runs.
- Throughput does not drop sharply when multiple sessions join or leave at once.
- Partner disconnects are handled once and do not duplicate state.
- The UI returns to a usable state after each failure scenario.

## Notes

- Record any race conditions or repeated WebSocket messages here.
- Add screenshots or console logs next to failing scenarios when you find them.
