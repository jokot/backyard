# Telegram's Automatic bot creation failed in Telegram Web

`hermes gateway setup`'s Automatic path (scan QR, confirm in Telegram) got
as far as showing Telegram's own "Create a bot" prompt, but clicking it
produced a client-side error with no response body, visible in the
browser's dev console against a
`newbot?manager=NousHostedHermesBot&username=...&name=...` call.

This traces to Telegram's own "Managed Bots" in-app creation feature
([[0005]] in the lesson explains what it does), not to Hermes or the
Nous onboarding broker — the failure happened inside Telegram Web's
client before any request reached Hermes's side at all. Likely cause:
that specific in-app flow isn't fully supported in the Telegram Web
client, only native mobile/desktop apps — unconfirmed, not worth
digging further into a third-party client's feature support.

Fixed by falling back to Manual: message `@BotFather`, `/newbot`, pick a
name and a globally-unique `...bot` username, paste the token into
`hermes gateway setup`'s manual prompt. Worked immediately.

Generalizes: when Automatic fails for any future specialist's Telegram
setup, don't debug Telegram's client — switch to Manual right away. It's
a couple more steps but has no dependency on that feature working.
