// Regalia sits behind the articulated creature, so later forms retain their
// expressive face, limbs and recorded voice while gaining a distinct silhouette.
function PetAscensionRegalia({speciesId,stage}) {
  if(stage<6)return null;
  const profile=PetEvolution.profile(speciesId);
  const aura=EcoData.PET_SPECIES.find(s=>s.id===speciesId)?.aura||'#d8f4dc';
  const seed=PetLivingRig.seed(speciesId),points=stage===6?8:stage===7?12:stage===8?16:20;
  const rays=Array.from({length:points},(_,i)=>{
    const angle=(i/points)*Math.PI*2+seed*.002,inner=stage===6?77:stage===7?71:stage===8?67:61,outer=stage===6?83:stage===7?87:stage===8?94:101;
    return <line key={i} x1={110+Math.cos(angle)*inner} y1={110+Math.sin(angle)*inner} x2={110+Math.cos(angle)*outer} y2={110+Math.sin(angle)*outer}/>;
  });
  const marks={leaf:'M0 11Q17 -20 0 -15Q-17 -20 0 11ZM0 10V-13',moon:'M9 -16A19 19 0 1 0 9 16A14 14 0 1 1 9 -16',star:'M0 -19L5 -5L19 0L5 5L0 19L-5 5L-19 0L-5 -5Z',sun:'M0 -19L5 -7L18 -9L9 0L18 9L5 7L0 19L-5 7L-18 9L-9 0L-18 -9L-5 -7Z',cloud:'M-17 5Q-19 -7 -7 -9Q-2 -21 10 -11Q21 -9 18 3Q11 15 -4 10Q-13 14 -17 5Z',wave:'M-20 6Q-10 -9 0 5Q10 17 20 -2M-20 13Q-9 2 1 14Q11 23 20 10',feather:'M-17 15Q-9 -19 17 -15Q12 4 -17 15ZM-14 12Q0 -1 13 -12',pearl:'M0 -17C21 -17 21 17 0 17C-21 17 -21 -17 0 -17Z',shield:'M0 -20L18 -12L15 8L0 20L-15 8L-18 -12Z',bolt:'M2 -20L-11 2H-1L-5 20L13 -5H2Z',bubble:'M0 -16A16 16 0 1 0 0 16A16 16 0 1 0 0 -16ZM-5 -10Q-10 -8 -10 -4',snow:'M0 -20V20M-20 0H20M-14 -14L14 14M14 -14L-14 14',coin:'M0 -18A18 18 0 1 0 0 18A18 18 0 1 0 0 -18ZM-8 0H8M0 -9V9',book:'M-19 -13Q-9 -18 0 -10Q9 -18 19 -13V15Q9 10 0 17Q-9 10 -19 15ZM0 -10V17',balance:'M0 -18V16M-15 -10H15M-19 4L-15 -10L-11 4ZM11 4L15 -10L19 4Z',sword:'M-2 -19H2L4 7H-4ZM-10 7H10M-2 8V19H2V8',lantern:'M-12 -10H12V12H-12ZM-16 -12H16M-7 -16H7M-6 16H6'};
  const mark=marks[profile.prop]||marks.star;
  return <svg className={`pet-ascension-regalia tier-${stage}`} viewBox="0 0 220 220" aria-hidden="true" style={{'--ascension-aura':aura}}>
    {stage>=8&&<g className="pet-ascension-wings"><path d="M76 95Q42 45 7 57Q37 69 28 91Q39 87 48 97Q53 80 76 95Z"/><path d="M144 95Q178 45 213 57Q183 69 192 91Q181 87 172 97Q167 80 144 95Z"/>{stage===9&&<><path d="M69 122Q25 94 4 119Q37 116 40 143Q53 127 69 122Z"/><path d="M151 122Q195 94 216 119Q183 116 180 143Q167 127 151 122Z"/></>}</g>}
    <circle className="pet-ascension-disc" cx="110" cy="110" r={stage>=8?70:74}/>
    <circle className="pet-ascension-orbit" cx="110" cy="110" r={stage===6?78:stage===7?76:72}/>
    <g className="pet-ascension-rays">{rays}</g>
    {stage>=7&&<g className="pet-ascension-stars">{Array.from({length:stage===7?5:stage===8?7:9},(_,i)=>{
      const a=(i/(stage===7?5:stage===8?7:9))*Math.PI*2+seed*.01,r=stage>=9?91:stage===8?86:82;
      return <circle key={i} cx={110+Math.cos(a)*r} cy={110+Math.sin(a)*r} r={stage>=9?3:2}/>;
    })}</g>}
    <g className="pet-ascension-crest" transform="translate(177 43)"><circle r="25"/><path d={mark}/></g>
  </svg>;
}
window.PetAscensionRegalia=PetAscensionRegalia;
