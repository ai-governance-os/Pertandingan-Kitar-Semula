# Pet human voice trial

Two Mandarin auditions generated with the connected HeyGen speech tool on
2026-09-15. They are candidates for listening feedback, not approved final
anime character voices. No student names or student recordings were sent.

| File | Voice | Voice ID | Speed | Duration |
| --- | --- | --- | --- | --- |
| male.mp3 | Theo - Excited | 44a6e603e3714f1fbba1370aac82f7af | 1.05 | 6.975 s |
| female.mp3 | Ceecee - Excited | 1cd326303dc3411eaa9fcda84ee7b921 | 1.05 | 6.243 s |

Locale: zh-CN. Both recordings say:

> 主人，你终于来啦！今天也一起加油吧！收集奖励卡，换我来守护你！

The provider returned URLs ending in .wav, but the downloaded bytes are MP3;
the checked-in filenames reflect the actual format.

Students default to unassigned creature sounds. An admin can explicitly choose
male or female in the pet detail panel. The selection belongs to the student
ID in `state.pets[id].voiceGender` and survives species swaps and evolution.
This first trial uses the same greeting at all stages. Other species-specific
dialogue remains available as subtitles for unassigned pets.

The standalone `pet-voice-preview.html` uses fictional demo owners and does not
load the app's cloud client or read/write student records. All audio is served
as static assets, loaded on click. No synthesis API key is shipped to browsers.
