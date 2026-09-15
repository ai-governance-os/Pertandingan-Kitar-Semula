# Pet cartoon child voice auditions, round 2

Two Mandarin auditions generated with the connected HeyGen speech tool on
2026-09-15 using voices returned by its Starfish-compatible catalog. They are
candidates for listening feedback on perceived age, Mandarin pronunciation and
expression, not approved final anime voices. No student names or student
recordings were sent. These are new character-voice generations, with no
post-processing pitch shift or movie dialogue/actor cloning.

| File | Voice | Voice ID | Speed | Duration |
| --- | --- | --- | --- | --- |
| male-v2.mp3 | Animated Joyboy | Hjjlh9YYCj8Ou4hl3QNO | 1.02 | 6.792 s |
| female-v2.mp3 | Vietnamese Kid Pal | sZpLvqANm4QQvpDhRiGd | 1.04 | 5.878 s |

Locale: zh-CN. Boy script:

> 嘿！你可算来啦！哼，今天的小挑战，我才不怕呢！来呀，一起冲！

Girl script:

> 嘿！你可算来啦！嘻嘻，今天的小挑战，我才不怕呢！走咯，一起冲！

The catalog labels both base voices female and English. App gender settings
select character roles, not the performer's gender. Perceived child age and
the fit of these multilingual voices for Mandarin still need listening review.

The provider returned URLs ending in .wav, but the downloaded bytes are MP3;
the checked-in filenames reflect the actual format.

Students default to unassigned creature sounds. An admin can explicitly choose
male or female in the pet detail panel. The selection belongs to the student
ID in `state.pets[id].voiceGender` and survives species swaps and evolution.
This trial uses the same greeting at all stages. Other species-specific
dialogue remains available as subtitles for unassigned pets.

The standalone `pet-voice-preview.html` uses fictional demo owners and does not
load the app's cloud client or read/write student records. All audio is served
as static assets, loaded on click. No synthesis API key is shipped to browsers.
