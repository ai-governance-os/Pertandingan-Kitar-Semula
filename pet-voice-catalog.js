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
    "id": "girl-reference-a",
    "gender": "female",
    "label": "小云 · 灵动女孩（A）",
    "url": "assets/voices/characters/girl-reference-a-v1.mp3",
    "duration": 4.24,
    "text": "丽恩主人，小胡须痒痒！一起绕圈圈！",
    "reviewed": true
  },
  {
    "id": "girl-reference-b",
    "gender": "female",
    "label": "小星 · 活泼女孩（B）",
    "url": "assets/voices/characters/girl-reference-b-v1.mp3",
    "duration": 4.4,
    "text": "丽恩主人，小胡须痒痒！一起绕圈圈！",
    "reviewed": true
  }
].map(voice=>Object.freeze(voice)));
 const defaults=Object.freeze({male:'boy-joy',female:'girl-pal'});
 return Object.freeze({list:gender=>voices.filter(voice=>!gender||voice.gender===gender),get:id=>voices.find(voice=>voice.id===id)||null,defaults});
})();

