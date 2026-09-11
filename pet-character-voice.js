// Human voice playback was withdrawn. Keep a no-op compatibility boundary so
// older UI integrations cannot re-enable speech packs or fetch their files.
window.PetCharacterVoice={resolve:()=>null,play:()=>false,warm:()=>{},stop:()=>{}};
