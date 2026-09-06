# Preference: model aggregator over subscription reuse or single-vendor keys

The user asked directly whether reusing a personal Claude Code subscription
or company Cursor subscription would work as Peashooter's model backend.
After hearing the usage-terms tradeoff (subscription reuse is a greyer area
than direct API billing; Cursor isn't reachable by third-party tools at
all), the user chose a different path than either: an API-key-based
aggregator (OpenRouter), specifically wanting freedom to pick per-bot
models including cheap Chinese-lab options (DeepSeek/GLM/Kimi/MiniMax).

This changes the spec's Stage 1 model/provider decision from a plain
Anthropic API key to OpenRouter, and should steer future specialist
design: expect the user to want cheap-model options considered for every
new profile going forward, not just Peashooter.
