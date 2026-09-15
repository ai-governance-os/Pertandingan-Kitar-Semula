// Stable character IDs belong to students. Never infer gender from names.
window.PetVoiceCatalog=(()=>{
 const voices=Object.freeze([
  {
    "id": "boy-joy",
    "gender": "male",
    "label": "阿焰 · 顽皮男孩",
    "url": "assets/voices/trial/male-v2.mp3",
    "duration": 6.8,
    "text": "嘿！你可算来啦！哼，今天的小挑战，我才不怕呢！来呀，一起冲！",
    "reviewed": true
  },
  {
    "id": "boy-spark",
    "gender": "male",
    "label": "小闪 · 元气男孩",
    "url": "assets/voices/characters/boy-spark-v1.mp3",
    "duration": 6.93,
    "text": "嘿！你可算来啦！哼，今天的小挑战，我才不怕呢！来呀，一起冲！",
    "reviewed": false
  },
  {
    "id": "boy-leap",
    "gender": "male",
    "label": "阿跃 · 开朗男孩",
    "url": "assets/voices/characters/boy-leap-v1.mp3",
    "duration": 5.8,
    "text": "嘿！你可算来啦！哼，今天的小挑战，我才不怕呢！来呀，一起冲！",
    "reviewed": false
  },
  {
    "id": "girl-pal",
    "gender": "female",
    "label": "小芽 · 俏皮女孩",
    "url": "assets/voices/trial/female-v2.mp3",
    "duration": 5.88,
    "text": "嘿！你可算来啦！嘻嘻，今天的小挑战，我才不怕呢！走咯，一起冲！",
    "reviewed": true
  },
  {
    "id": "girl-bell",
    "gender": "female",
    "label": "小铃 · 灵动女孩",
    "url": "assets/voices/characters/girl-bell-v1.mp3",
    "duration": 7.01,
    "text": "嘿！你可算来啦！嘻嘻，今天的小挑战，我才不怕呢！走咯，一起冲！",
    "reviewed": false
  }
].map(voice=>Object.freeze(voice)));
 const defaults=Object.freeze({male:'boy-joy',female:'girl-pal'});
 return Object.freeze({list:gender=>voices.filter(voice=>!gender||voice.gender===gender),get:id=>voices.find(voice=>voice.id===id)||null,defaults});
})();

