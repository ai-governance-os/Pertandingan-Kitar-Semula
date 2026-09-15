# Expanded cartoon voice auditions

Generated with HeyGen's Starfish speech endpoint on 2026-09-15, locale `zh-CN`.
Three additional candidates join the two recordings retained from round 2.
No student names or recordings were sent to the provider.

| Stable app ID | App name | Provider voice | Provider ID | Speed | Seconds |
| --- | --- | --- | --- | --- | --- |
| boy-spark | 小闪 · 元气男孩 | Braz. Cartoon Boy | 1apZPj6TsMk8Zmd88Btm | 1.02 | 6.922 |
| boy-leap | 阿跃 · 开朗男孩 | Cheerful Boy (ES) | AVOPrFWR8uIjg0PjPok2 | 1.02 | 5.799 |
| girl-bell | 小铃 · 灵动女孩 | Wizie Girl - Voice 1 | FfRL0YhXLrrDm3DRs9Jd | 1.04 | 7.001 |

The catalog source of truth is `pet-voice-catalog.js`. Character-role groups
are separate from the provider's performer-gender metadata. These additional
multilingual candidates need listening feedback on age, Mandarin pronunciation,
and expression; the two existing accepted recordings remain the defaults.

Students explicitly select a role group in `state.pets[id].voiceGender` and a
stable catalog ID in `state.pets[id].voiceId`. Voices outside the selected group
are rejected. Legacy gender-only settings keep the accepted default voice.
Changing groups clears an incompatible voice choice. Renaming students,
swapping species and evolution retain their chosen voice IDs.

The audition page uses only demo owners. Audio is loaded on click, never on
initial page load; recordings are distinct files, not playback-rate variants.
All samples use the same script within their role group for comparison.
