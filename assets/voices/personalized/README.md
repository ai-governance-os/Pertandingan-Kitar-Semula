# Personalized pet dialogue

114 recordings cover the confirmed 19 students, their assigned character voices,
and all six stages of their current species. The dialogue comes from
`pet-dialogue.js`, prefixed with the owner's given name and 主人.

Generated through HeyGen Starfish using the same five child character voices as
the approved auditions, locale `zh-CN`, speed 1.02 for boy roles and 1.04 for girl
roles. Six lines were synthesized per owner with explicit 1.5-second SSML breaks.
Provider word timestamps were checked against the complete requested text before
splitting at those breaks with FFmpeg. Each stage has an independent MP3 file.

`manifest.json` records the owner, species, voice and exact text of every clip.
`pet-personalized-voices.js` supplies that index synchronously so a user gesture
can start playback. Only the selected clip is fetched on demand.

Playback requires matching student ID, given name, species, selected voice and
stage text. If an edit requires a new recording, personalized subtitles and
creature sounds remain available; an unrelated voice audition is never played.
The voice selection itself remains attached to the student in cloud state.
