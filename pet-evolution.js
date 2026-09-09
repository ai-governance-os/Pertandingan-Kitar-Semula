// One identity, six collectible forms and six choreographed interactions.
// IDs match EcoData; names and owners always come from the live roster.
const EVOLUTION_PROFILES = {
  hornbeetle: { prop:"leaf", motion:"beetle", temperament:"爱举树叶的勇敢小甲虫", features:["翡翠甲纹蛋","独角探壳","短角小独角仙","橡果袋与分叉角","展开翅甲与金护甲","通天巨角与虹彩翼"], acts:["角纹叩蛋","顶壳举嫩叶","低头挑起叶片","举角传橡果","开甲振翅飞","巨角托起森林"] },
  moonrabbit: { prop:"moon", motion:"rabbit", temperament:"喜欢把月光分给朋友", features:["月玉纹蛋","长耳探壳","短腿玉兔","月牙项链","月披风与玉臼","月冠长耳与灵月"], acts:["月光敲壳","耳朵接月牙","蹦跳追月影","捧月鞠躬","捣药抛月珠","月宫踏星舞"] },
  lotusotter: { prop:"pearl", motion:"otter", temperament:"爱把珍珠送给你", features:["莲纹水蛋","小獭搭壳","圆脸水獭","莲花项圈","贝甲与珍珠碗","莲冠与流水缎"], acts:["水珠托蛋","小爪接水珠","仰泳抱珍珠","搓珠献莲花","翻身抛珠接","莲海珍珠礼"] },
  coralpanda: { prop:"bubble", motion:"panda", temperament:"爱收集漂亮贝壳", features:["珊瑚斑蛋","环尾探壳","短尾小熊猫","珊瑚坠","礁甲与海螺杖","珊瑚角冠与巨尾"], acts:["贝纹闪闪","抱壳吹泡","追尾扑贝壳","抱螺听海声","举杖唤珊瑚","珊瑚花园礼"] },
  sunlion: { prop:"sun", motion:"lion", temperament:"像阳光一样热情", features:["曦光金蛋","圆耳狮爪探壳","短鬃小狮","太阳勋章","金色日鬃与护腕","烈日鬃冠"], acts:["暖光绕蛋","小爪捧太阳","扑日打哈欠","挺胸晒勋章","踏日跃金环","曦光狮王礼"] },
  crystalowl: { prop:"star", motion:"owl", temperament:"认真观察的小学者", features:["晶羽纹蛋","小喙探壳","绒球小鸮","水晶眼镜","晶翼与学者绶带","星冠与晶羽大翼"], acts:["晶光敲蛋","歪头接晶片","小跳找星星","推眼镜点头","展翼织晶环","水晶星空礼"] },
  mossbear: { prop:"leaf", motion:"bear", temperament:"喜欢种花的温柔大个子", features:["苔纹山蛋","熊掌搭壳","苔色小熊","树叶书包","肩上花园与木杖","花树冠与苔山背"], acts:["绿芽挠蛋","小掌拍嫩叶","打滚抱树叶","打开叶书包","举杖长小树","花开山林礼"] },
  lotusfrog: { prop:"leaf", motion:"frog", temperament:"爱吹笛的小歌手", features:["莲叶纹蛋","蛙眼探壳","小莲心蛙","莲叶小帽","花瓣披风与芦笛","盛莲冠与水披风"], acts:["莲叶盖蛋","顶壳接莲叶","蹲低跳水珠","顶帽转一圈","吹笛唤莲花","莲池圆舞曲"] },
  aurorabutterfly: { prop:"star", motion:"butterfly", temperament:"爱画彩虹的小精灵", features:["虹彩茧蛋","触角探壳","小翅幼蝶","初生彩翅","琉璃翼与宝石坠","极光巨翼"], acts:["彩光绕茧","触角碰星点","扑翅追光点","盘旋画彩带","展翼织虹桥","极光蝶梦舞"] },
  ambermantis: { prop:"leaf", motion:"mantis", temperament:"礼貌又灵巧的练武家", features:["琥珀叶纹蛋","螳臂探壳","短臂小螳","小叶围巾","玉臂刃与琥珀甲","晶冠与翡翠大翼"], acts:["叶影敲蛋","小臂合掌礼","弯臂接落叶","弓步练叶拳","旋臂舞双叶","琥珀千叶礼"] },
  staghorn: { prop:"shield", motion:"stag", temperament:"喜欢帮忙搬东西", features:["铜甲纹蛋","双钳探壳","短钳小甲虫","初生铜钳","鹿角双钳与翼盾","枝状巨钳与铜翼"], acts:["铜纹轻叩","小钳顶壳","夹叶搬回家","举钳行礼","展盾旋身跃","双钳擎天礼"] },
  jewelspider: { prop:"pearl", motion:"spider", temperament:"爱编小礼物的巧手", features:["宝珠纹蛋","大眼小蛛探壳","短脚跳蛛","珍珠蝴蝶结","宝石脚环与丝披风","欧泊冠与丝珠阵"], acts:["丝珠绕蛋","前足接珠","小步跳格子","织丝打蝴蝶结","跃起编珠环","宝珠织梦礼"] },
  honeybee: { prop:"sun", motion:"bee", temperament:"勤劳又爱分享", features:["蜜格纹蛋","蜂须探壳","绒球小蜂","花粉小袋","蜂巢甲与金花杖","蜜冠与四片光翼"], acts:["蜜光叩蛋","小翅扇花粉","飞八字采花","捧蜜鞠躬","举杖开金花","蜜金花海礼"] },
  maplehedgehog: { prop:"leaf", motion:"hedgehog", temperament:"慢慢靠近你的害羞伙伴", features:["枫纹灵蛋","小鼻探壳","软刺小刺团","枫叶胸针","枫刺披风与橡果带","金枫巨冠"], acts:["枫叶盖蛋","鼻尖顶落叶","卷团滚枫叶","抖背散小叶","旋身枫叶雨","秋林丰收礼"] },
  misttapir: { prop:"moon", motion:"tapir", temperament:"守护好梦的小伙伴", features:["梦雾纹蛋","小鼻探壳","圆身小貘","梦铃","月饰与紫梦披肩","星鞍月冠与梦缎"], acts:["梦雾拥蛋","小鼻吹月泡","慢步追梦球","摇铃织梦","抬鼻唤月环","星梦巡夜礼"] },
  staraxolotl: { prop:"star", motion:"axolotl", temperament:"总是笑眯眯的水精灵", features:["星鳃纹蛋","绒鳃探壳","短鳃小灵","星星项链","水晶鳃尖与水环","巨幅星鳃与鳍披风"], acts:["星泡托蛋","小鳃碰星点","摇鳃追水珠","游弧画星星","跃水展晶鳃","星海绽放礼"] },
  opaljelly: { prop:"pearl", motion:"jelly", temperament:"透明又温柔的小灯笼", features:["琉璃水蛋","小触手探壳","小伞水母","珍珠蝴蝶结","层叠琉璃伞与珠穗","灯冠与虹彩长缎"], acts:["珍珠围蛋","小触手接珠","缩伞弹一跳","摇穗点水灯","旋伞织珠帘","琉璃星灯礼"] },
  tidemanta: { prop:"wave", motion:"manta", temperament:"喜欢带朋友兜风", features:["潮纹蓝蛋","鳐翼探壳","短翼小鳐","贝壳项链","银翼甲与浪纹","潮冠与巨幅银蓝翼"], acts:["潮水托蛋","小翼拍水花","滑翔追浪点","转弯画浪环","展翼翻潮圈","潮汐天幕游"] },
  conchsquid: { prop:"bubble", motion:"squid", temperament:"爱哼旋律的海洋乐手", features:["螺纹紫蛋","小触腕探壳","短腕小鱿","海螺坠","螺冠与音珠腕环","灵螺巨冠与长腕"], acts:["螺声轻叩","触腕拍泡泡","弹游追贝音","举螺吹小调","旋腕击珠拍","螺音海洋曲"] },
  silvercarp: { prop:"pearl", motion:"carp", temperament:"勇敢尝试每一次跳跃", features:["银鳞纹蛋","小鱼头探壳","短鳍小鲤","玉鳍扣","缎鳍与珍珠甲","莲冠与金色巨尾"], acts:["鳞光映蛋","探头吐小珠","摆尾跳水珠","衔珠画水弧","跃浪穿珠环","银鲤跃星河"] },
  coconutcrab: { prop:"shield", motion:"crab", temperament:"认真搬运的小力士", features:["椰纹甲蛋","小钳探壳","圆眼小蟹","椰壳帽","贝甲与珠钳环","巨钳与热带叶冠"], acts:["椰纹叩蛋","小钳拍壳沿","横步搬贝壳","举椰帽问好","双钳托贝盾","椰岛守护礼"] },
  pebblepenguin: { prop:"snow", motion:"penguin", temperament:"滑倒了也笑嘻嘻", features:["冰砾纹蛋","小喙探壳","圆肚小企鹅","针织围巾","冰晶披风与雪章","极光羽冠与冰盾"], acts:["冰花绕蛋","小喙顶冰花","肚皮滑冰步","抖巾接雪花","旋滑举冰盾","极光冰场秀"] },
  sunmeerkat: { prop:"sun", motion:"meerkat", temperament:"为朋友放哨的小队员", features:["沙日纹蛋","小头探壳","短身小獴","侦察红巾","太阳镜与望远筒","金冠披风与日镜"], acts:["日影绕蛋","探头望一望","踮脚追光斑","站直侦察礼","跳台转望远镜","日哨巡光礼"] },
  rainchameleon: { prop:"star", motion:"chameleon", temperament:"把心情变成彩虹", features:["虹纹灵蛋","卷尾探壳","小冠变色蜥","彩虹颈环","棱晶背冠与宝石环","虹彩巨冠与卷尾"], acts:["虹光点蛋","尾尖接彩点","慢爬捉光点","卷尾画彩环","展冠散棱光","七色虹桥礼"] },
  velvetbat: { prop:"moon", motion:"bat", temperament:"爱偷偷送惊喜", features:["绒月纹蛋","大耳探壳","绒球小蝠","月牙领结","月扣与紫翼","银月冠与星纹巨翼"], acts:["月影亲蛋","大耳接月牙","倒挂小翻身","展翅藏月亮","飞环追月光","绒月夜空舞"] },
  blossomhorse: { prop:"leaf", motion:"horse", temperament:"喜欢迎风奔跑", features:["花风纹蛋","小鬃探壳","短腿小驹","花环","玫瑰鬃辫与叶鞍","繁花长鬃与缎尾"], acts:["花瓣围蛋","小鼻接花瓣","踏花小跑步","甩鬃撒花瓣","绕花圈飞跃","花风原野游"] },
  jadeelephant: { prop:"pearl", motion:"elephant", temperament:"温柔可靠的小帮手", features:["玉纹山蛋","小鼻探壳","圆耳幼象","玉铃","金额甲与丝鞍","莲冠与玉耳饰"], acts:["玉珠敲蛋","卷鼻顶壳","小鼻卷水珠","摇铃鞠躬","踏步抛玉珠","玉山莲华礼"] },
  sandsquirrel: { prop:"coin", motion:"squirrel", temperament:"会把好东西留给朋友", features:["沙金纹蛋","小尾探壳","短尾松鼠","小铃项链","琥珀镜与沙巾","金色巨尾与宝袋"], acts:["金粒绕蛋","小爪抱铃","追果急转弯","抖袋找宝物","跃起接金果","沙海藏宝礼"] },
  orchidlemur: { prop:"leaf", motion:"lemur", temperament:"喜欢和伙伴一起跳舞", features:["兰纹环尾蛋","大眼探壳","短尾小狐猴","兰花项圈","兰肩披风与玉腕环","繁兰冠与银环长尾"], acts:["兰叶拥蛋","尾尖接小兰","跳步追花瓣","摆臂兰花舞","腾跃转花环","兰林月下舞"] },
  stormram: { prop:"cloud", motion:"ram", temperament:"稳稳向前的小勇士", features:["风纹绒蛋","卷角探壳","软绒小羊","风铃","螺角护甲与云绒披风","巨幅螺角与云鬃"], acts:["风铃唤蛋","卷角顶云朵","踏步蹦云团","摇角奏风铃","踏云展绒披风","风岳云海礼"] },
  roseflamingo: { prop:"feather", motion:"flamingo", temperament:"爱优雅转圈的小舞者", features:["绯羽纹蛋","弯喙探壳","短腿小鹭","珍珠脚环","玫瑰羽领与翼饰","花冠与绯羽大翼"], acts:["绯羽绕蛋","小喙接羽毛","单脚找平衡","踮脚转珠环","展翼花羽舞","绯霞花海礼"] },
  qilin: { prop:'cloud', motion:'prance', temperament:'温柔的小福星', features:['祥云纹蛋','小角探出蛋壳','短腿幼麒麟','玉铃与分枝角','云纹肩甲与金鬃','通天灵角与流云'], acts:['云纹打招呼','顶壳接云朵','追云小跳步','玉铃唤祥云','踏云三连跃','开天祥云阵'] },
  phoenix: { prop:'feather', motion:'soar', temperament:'爱唱歌的暖心伙伴', features:['金羽纹蛋','绒羽小凤凰','短翅凤凰宝宝','珍珠佩与长尾羽','日冠与层叠金翼','鎏金凤羽与焰尾'], acts:['羽光敲敲壳','小翅接落羽','扑翅追羽毛','旋身织羽环','腾空落金羽','凤凰涅槃舞'] },
  ninetail: { prop:'moon', motion:'twirl', temperament:'爱捉迷藏的小机灵', features:['月纹灵蛋','尖耳小狐探头','单尾小狐狸','月牙项圈与三尾','灵符与五尾','九尾月华冠'], acts:['月牙躲猫猫','探头接月亮','追尾滚一圈','三尾月步舞','灵符分身跃','九尾邀明月'] },
  yinglong: { prop:'cloud', motion:'loop', temperament:'勇敢又有点冒失', features:['天蓝龙纹蛋','小翼破壳','圆脸小翼龙','云巾与成长双翼','云纹胸甲与大翼','金蓝巨翼与天缎'], acts:['云团托龙蛋','小翼顶蛋壳','试飞软着陆','绕云练飞行','冲云大回旋','苍穹巡游礼'] },
  baize: { prop:'book', motion:'bow', temperament:'会分享知识的小学者', features:['白玉灵纹蛋','卷角探壳','绒毛白泽宝宝','书袋与学者围巾','玉冠与浮空书','灵角与三卷天书'], acts:['书页轻敲蛋','顶壳读一页','追赶小书本','鞠躬开书卷','跃起翻天书','万卷星光阵'] },
  lingui: { prop:'balance', motion:'stamp', temperament:'认真公平的小裁判', features:['碧玉独角纹蛋','独角顶壳','短角獬豸宝宝','天平玉坠','角甲与翡翠护肩','水晶独角与灵秤'], acts:['玉光敲蛋壳','独角顶小玉','小步找平衡','点头托灵秤','踏地护玉盾','天平守护阵'] },
  stardeer: { prop:'star', motion:'bound', temperament:'喜欢收集星光', features:['繁星灵蛋','小耳破壳','星斑小鹿','星坠与初生鹿角','水晶鹿角与星披肩','星座巨角与群星'], acts:['星星绕蛋转','探头接星星','跳跃追流星','鹿角点星灯','踏星飞跃','星河鹿王礼'] },
  cloudpard: { prop:'cloud', motion:'pounce', temperament:'爱躲云里的淘气鬼', features:['云斑金蛋','小豹爪搭壳','圆脸斑点幼豹','云纹领巾','云护腕与长尾','云鬃与天纹腿甲'], acts:['云尾逗蛋壳','小爪拍云团','伏低扑云朵','潜行藏云后','旋跃破云环','流云瞬步秀'] },
  seakirin: { prop:'bubble', motion:'swim', temperament:'爱吹泡泡的海洋朋友', features:['海纹珍珠蛋','小鳍探壳','卷尾海麟宝宝','珍珠项链','珊瑚冠与虹彩鳍','海王冠与巨幅灵鳍'], acts:['泡泡托起蛋','探头吐泡泡','追泡绕圈游','顶珠画水环','跃浪翻跟斗','潮汐珍珠礼'] },
  pixiu: { prop:'coin', motion:'tumble', temperament:'喜欢藏宝也喜欢分享', features:['金钱纹灵蛋','小金爪抱壳','圆滚滚貔貅','红绳与金钱坠','玉金胸甲与双翼','宝冠金鬃与羽翼'], acts:['金币叮叮蛋','抱壳接金币','翻滚追金币','抱宝鞠躬礼','踏金腾跃','金玉满堂礼'] },
  thunder: { prop:'bolt', motion:'dart', temperament:'活力满满的小闪电', features:['雷纹蓝金蛋','小雷羽破壳','圆脸雷鸟','闪电羽冠','金爪环与电光翼','雷霆冠与锯齿巨翼'], acts:['电光敲蛋壳','小羽放静电','蹦跳追电点','振翅画闪电','电光折线冲','雷霆天幕秀'] },
  bamboo: { prop:'leaf', motion:'sprout', temperament:'慢热又爱照顾植物', features:['竹叶纹灵蛋','嫩芽探壳','短手叶灵宝宝','叶披风与竹笛','竹杖与叶冠','千层竹冠与灵藤'], acts:['叶芽挠蛋壳','探头接嫩叶','打滚追小叶','吹笛唤竹叶','举杖生竹林','万叶森林礼'] },
  zhuque: { prop:'sun', motion:'fan', temperament:'爱漂亮的小舞者', features:['朱羽金纹蛋','红绒冠探壳','短尾朱雀宝宝','丝带与三支眼羽','金羽饰与半开尾屏','日冠与朱红巨屏'], acts:['日光亲蛋壳','小冠顶太阳','踮脚小转圈','丝带旋舞','金羽开屏舞','朱雀迎日礼'] },
  xuanwu: { prop:'wave', motion:'breach', temperament:'温柔的大梦想家', features:['海天纹灵蛋','小鳍探出壳','圆脸小鲲鹏','珍珠翼扣','海纹护带与羽翼','巨鲲羽翼与天幕长尾'], acts:['浪花托灵蛋','小鳍拍浪花','游弧追水珠','羽鳍乘微风','跃海展大翼','鲲鹏万里游'] },
  baihu: { prop:'sword', motion:'strike', temperament:'外表勇猛，内心爱撒娇', features:['银蓝虎纹蛋','圆耳虎爪探壳','白虎小奶猫','蓝巾与玉爪环','银护肩与守护剑','银鬃王冠与灵剑'], acts:['小爪叩虎蛋','虎爪拍壳沿','伏低扑绒球','挺胸练虎步','凌空守护斩','白虎星剑礼'] },
  qinglong: { prop:'pearl', motion:'coil', temperament:'喜欢绕着你打招呼', features:['青玉龙纹蛋','小须小角探壳','短身幼青龙','玉珠与初生龙角','金环与长身龙角','金鬃巨角与灵珠'], acts:['灵珠绕龙蛋','探头追小珠','绕珠画小圈','盘身托玉珠','腾云穿珠环','青龙衔珠巡天'] },
  griffin: { prop:'shield', motion:'salute', temperament:'热爱探险的小队长', features:['狮羽纹金蛋','小喙小爪探壳','狮爪小狮鹫','探险蓝围巾','飞行护镜与肩带','金冠巨翼与守护盾'], acts:['羽纹叩叩蛋','小喙顶壳礼','扑翅小敬礼','俯身探险礼','展翼举盾跃','狮鹫骑士巡礼'] },
  snowferret: { prop:'snow', motion:'slide', temperament:'害羞却爱玩雪', features:['冰花纹灵蛋','小鼻探出壳','短尾雪貂宝宝','蓝色针织围巾','冰晶冠与雪披风','雪花王冠与流霜长尾'], acts:['雪花轻吻蛋','探头接雪花','雪地滑一跤','围巾旋雪舞','滑翔抛冰花','极光雪花礼'] },
  firemouse: { prop:'lantern', motion:'scamper', temperament:'小小身体，大大热情', features:['火星纹灵蛋','大耳小鼠探壳','圆耳火鼠宝宝','金铃与火星颊纹','火焰护手与灯杖','红玉冠与巨型灵灯'], acts:['火星绕蛋跳','探头吹火星','追灯急刹车','摇铃点小灯','跃起举焰灯','万灯迎星礼'] },
};
const PET_FORM_NAMES = ['蛋','破壳','幼兽','守护兽','战将兽','传奇'];
function evolutionProfile(id) { return EVOLUTION_PROFILES[id] || EVOLUTION_PROFILES.qilin; }
function evolutionAsset(id, stage) { return 'assets/pet-park/evolution/' + id + '/' + Math.max(0, Math.min(5, stage)) + '.webp'; }
// Each creature has its own trajectory, then its six acts vary the choreography,
// articulation, props, rhythm and finish. Positions are local to the actor.
const EVOLUTION_PATHS = {
beetle:[[0,0],[-10,4],[-22,-8],[28,-20],[10,-6],[0,0]],
rabbit:[[0,0],[-14,7],[-16,-16],[20,-26],[14,-10],[0,0]],
otter:[[0,0],[-18,10],[-10,-24],[12,-32],[18,-14],[0,0]],
panda:[[0,0],[-22,13],[-4,-32],[4,-38],[22,-18],[0,0]],
lion:[[0,0],[-26,4],[2,-40],[28,-44],[26,-22],[0,0]],
owl:[[0,0],[-30,7],[8,-8],[20,-50],[10,-26],[0,0]],
bear:[[0,0],[-10,10],[14,-16],[12,-20],[14,-30],[0,0]],
frog:[[0,0],[-14,13],[-22,-24],[4,-26],[18,-6],[0,0]],
butterfly:[[0,0],[-18,4],[-16,-32],[28,-32],[22,-10],[0,0]],
mantis:[[0,0],[-22,7],[-10,-40],[20,-38],[26,-14],[0,0]],
stag:[[0,0],[-26,10],[-4,-8],[12,-44],[10,-18],[0,0]],
spider:[[0,0],[-30,13],[2,-16],[4,-50],[14,-22],[0,0]],
bee:[[0,0],[-10,4],[8,-24],[28,-20],[18,-26],[0,0]],
hedgehog:[[0,0],[-14,7],[14,-32],[20,-26],[22,-30],[0,0]],
tapir:[[0,0],[-18,10],[-22,-40],[12,-32],[26,-6],[0,0]],
axolotl:[[0,0],[-22,13],[-16,-8],[4,-38],[10,-10],[0,0]],
jelly:[[0,0],[-26,4],[-10,-16],[28,-44],[14,-14],[0,0]],
manta:[[0,0],[-30,7],[-4,-24],[20,-50],[18,-18],[0,0]],
squid:[[0,0],[-10,10],[2,-32],[12,-20],[22,-22],[0,0]],
carp:[[0,0],[-14,13],[8,-40],[4,-26],[26,-26],[0,0]],
crab:[[0,0],[-18,4],[14,-8],[28,-32],[10,-30],[0,0]],
penguin:[[0,0],[-22,7],[-22,-16],[20,-38],[14,-6],[0,0]],
meerkat:[[0,0],[-26,10],[-16,-24],[12,-44],[18,-10],[0,0]],
chameleon:[[0,0],[-30,13],[-10,-32],[4,-50],[22,-14],[0,0]],
bat:[[0,0],[-10,4],[-4,-40],[28,-20],[26,-18],[0,0]],
horse:[[0,0],[-14,7],[2,-8],[20,-26],[10,-22],[0,0]],
elephant:[[0,0],[-18,10],[8,-16],[12,-32],[14,-26],[0,0]],
squirrel:[[0,0],[-22,13],[14,-24],[4,-38],[18,-30],[0,0]],
lemur:[[0,0],[-26,4],[-22,-32],[28,-44],[22,-6],[0,0]],
ram:[[0,0],[-30,7],[-16,-40],[20,-50],[26,-10],[0,0]],
flamingo:[[0,0],[-10,10],[-10,-8],[12,-20],[10,-14],[0,0]],
  prance:[[0,0],[-18,0],[-12,-35],[20,-15],[8,-42],[0,0]],
  soar:[[0,0],[0,8],[-20,-26],[12,-58],[25,-20],[0,0]],
  twirl:[[0,0],[20,0],[30,-18],[0,-35],[-28,-10],[0,0]],
  loop:[[0,0],[-18,10],[-35,-20],[0,-64],[35,-20],[0,0]],
  bow:[[0,0],[0,10],[-10,8],[8,-8],[0,-20],[0,0]],
  stamp:[[0,0],[-8,5],[0,-24],[0,12],[15,-30],[0,0]],
  bound:[[0,0],[-30,8],[-18,-40],[18,-52],[34,-10],[0,0]],
  pounce:[[0,0],[-24,12],[-28,15],[28,-24],[38,4],[0,0]],
  swim:[[0,0],[-30,-12],[-12,18],[28,-18],[12,-35],[0,0]],
  tumble:[[0,0],[-25,6],[-16,-18],[20,8],[30,-12],[0,0]],
  dart:[[0,0],[0,8],[-32,-20],[32,-40],[-12,-48],[0,0]],
  sprout:[[0,0],[0,12],[-12,5],[12,-18],[0,-32],[0,0]],
  fan:[[0,0],[0,6],[-18,-10],[18,-14],[0,-20],[0,0]],
  breach:[[0,0],[-22,18],[-32,5],[15,-52],[28,-30],[0,0]],
  strike:[[0,0],[-20,12],[-30,14],[32,-26],[8,-12],[0,0]],
  coil:[[0,0],[-24,-14],[0,18],[32,-12],[0,-40],[0,0]],
  salute:[[0,0],[0,12],[-12,-15],[0,-42],[20,-16],[0,0]],
  slide:[[0,0],[-32,8],[-12,18],[35,16],[28,-12],[0,0]],
  scamper:[[0,0],[-28,4],[28,2],[-12,-24],[35,8],[0,0]],
};
function evolutionPose(id, stage, progress) {
  const profile = evolutionProfile(id);
  const seed = Object.keys(EVOLUTION_PROFILES).indexOf(id) + 1;
  const t = Math.max(0, Math.min(1, progress));
  const envelope = Math.sin(Math.PI * t);
  const path = EVOLUTION_PATHS[profile.motion];
  const speeds = [0, .16, .32, .56, .76, 1];
  let segment = 0;
  while(segment < 4 && t > speeds[segment + 1]) segment++;
  let q = (t - speeds[segment]) / (speeds[segment + 1] - speeds[segment]);
  q = q * q * (3 - 2 * q);
  const a = path[segment], b = path[segment + 1];
  const intensity = [.18, .32, .65, .8, 1.05, 1.2][stage];
  const x = (a[0] + (b[0] - a[0]) * q) * intensity;
  const y = (a[1] + (b[1] - a[1]) * q) * intensity;
  const rolling = ['twirl','tumble','slide'].includes(profile.motion);
  const turn = rolling && stage >= 2 ? Math.sin(t * Math.PI) * (stage === 2 ? 1.6 : .4) : 0;
  const pose = {
    x, y, angle: turn + Math.sin(t * Math.PI * 2) * (.025 * ((seed % 5) + 1)) * intensity,
    stretch: 1 + Math.sin(t * Math.PI * (stage + 2)) * envelope * (stage < 2 ? .08 : .035),
    head: Math.sin(t * Math.PI * (2 + seed % 3)) * envelope * (stage === 0 ? 0 : 9),
    wings: Math.sin(t * Math.PI * (4 + stage * 2 + seed % 3)) * envelope * (stage < 2 ? 3 : 14),
    tail: Math.sin(t * Math.PI * (3 + seed % 4)) * envelope * (3 + stage * 2),
    envelope, seed, stage, t,
  };
  if(stage>=2){
    const move=profile.motion,beat=Math.sin(t*Math.PI),double=Math.sin(t*Math.PI*2);
    const roll=Math.max(0,Math.min(1,(t-.15)/.7));
    const smooth=roll*roll*(3-2*roll);
    if(['hedgehog','otter','tumble','twirl'].includes(move)&&stage===2)pose.angle=2*Math.PI*smooth;
    if(move==='beetle'){
      pose.x=stage<4?0:Math.sin(t*Math.PI*2)*22;
      pose.y=stage<4?Math.sin(t*Math.PI*2)*10:-beat*(stage===4?52:75);
      pose.angle=-Math.sin(t*Math.PI*2)*.2;
      pose.head=-beat*(10+stage*2);pose.wings*=stage>=4?1.7:.15;
    }
    if(move==='rabbit'){pose.y=-Math.abs(Math.sin(t*Math.PI*2))*36*intensity;pose.x=double*28;}
    if(move==='frog'){pose.y=t<.3?Math.sin(t/.3*Math.PI)*14:-Math.sin((t-.3)/.7*Math.PI)*65*intensity;pose.stretch=1+double*.13;}
    if(move==='butterfly'){pose.x=double*48*intensity;pose.y=-beat*45+Math.sin(t*Math.PI*4)*12;pose.angle=double*.25;}
    if(move==='bee'){pose.x=Math.sin(t*Math.PI*4)*30*intensity;pose.y=-beat*48;pose.wings*=1.7;}
    if(move==='crab'){pose.y=0;pose.x=Math.sin(t*Math.PI*4)*36*beat;pose.angle=0;}
    if(move==='penguin'){pose.y=beat*22;pose.x=double*45;pose.angle=beat*1.1;}
    if(move==='bat'){pose.angle=stage===2?-Math.PI*beat:double*.6;pose.y=-beat*55;}
    if(move==='jelly'){pose.x=double*12;pose.y=-Math.abs(double)*35;pose.stretch=1+double*.16;}
    if(move==='squid'){pose.x=-Math.sin(t*Math.PI)*65;pose.y=double*20;pose.stretch=1+double*.1;}
    if(move==='manta'){pose.x=double*55;pose.y=-beat*35;pose.angle=double*.3;}
    if(move==='carp'){pose.x=double*30;pose.y=-beat*72;pose.angle=double*.7;}
    if(move==='meerkat'){pose.x=double*8;pose.y=-beat*14;pose.stretch=1+beat*.1;pose.head=double*15;}
    if(move==='owl'){pose.x=0;pose.y=-beat*12;pose.head=double*22;}
    if(move==='mantis'){pose.x=double*23;pose.y=beat*10;pose.angle=double*.16;pose.wings*=.25;}
    if(move==='spider'){pose.x=Math.sin(t*Math.PI*6)*24*beat;pose.y=-Math.abs(Math.sin(t*Math.PI*3))*24;}
    if(move==='flamingo'){pose.x=0;pose.y=-beat*16;pose.angle=double*.28;pose.wings*=1.35;}
    if(move==='chameleon'){pose.x=-beat*25;pose.y=double*4;pose.head=double*12;pose.tail*=2;}
    if(move==='elephant'){pose.x=double*12;pose.y=-Math.abs(Math.sin(t*Math.PI*3))*12;pose.head=beat*23;}
    if(move==='horse'){pose.x=double*38;pose.y=-Math.abs(Math.sin(t*Math.PI*3))*25;}
    if(move==='ram'){pose.x=double*20;pose.y=-beat*32;pose.head=-double*20;}
    if(move==='stag'){pose.x=double*18;pose.y=-beat*24;pose.head=-beat*19;}
    if(move==='tapir'){pose.x=double*18;pose.y=-beat*18;pose.head=double*18;}
    if(move==='squirrel'){pose.x=Math.sin(t*Math.PI*4)*42*beat;pose.y=-Math.abs(double)*22;pose.tail*=1.5;}
    if(move==='lemur'){pose.x=double*34;pose.y=-Math.abs(Math.sin(t*Math.PI*3))*38;pose.angle=double*.35;}
    if(move==='bear'&&stage===2){pose.angle=2*Math.PI*smooth;pose.x=double*28;}
    if(move==='lion'){pose.y=t<.3?beat*15:-Math.sin((t-.3)/.7*Math.PI)*38;pose.head=double*14;}
    if(move==='panda'){pose.x=Math.sin(t*Math.PI*3)*30*beat;pose.tail*=1.7;}
    if(move==='axolotl'){pose.x=double*25;pose.y=-beat*25;pose.head=double*13;pose.tail*=1.5;}
    // The guardian presents its accessory; the champion accelerates into a leap.
    if(stage===3){pose.x*=.65;pose.y*=.7;pose.head+=beat*5;}
    if(stage===4){pose.y-=beat*12;pose.wings*=1.15;}
    if(stage===5){pose.y-=beat*22;pose.tail*=1.2;}
  }
  return pose;
}
function parkPerformancePose(id,stage,t,width,height,origin,size,reduced=false){
  t=Math.max(0,Math.min(1,t));
  const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
  const lerp=(a,b,q)=>a+(b-a)*q;
  const seed=Object.keys(EVOLUTION_PROFILES).indexOf(id)+1;
  const motion=evolutionProfile(id).motion;
  const fly=['soar','loop','dart','fan','salute','breach','beetle','stag','owl','butterfly','bee','bat','flamingo'].includes(motion);
  const swim=['swim','coil','otter','axolotl','jelly','manta','squid','carp'].includes(motion);
  const intro=smooth(t/.14),outro=smooth((t-.86)/.14),visible=intro*(1-outro);
  const scale=lerp(origin.scale,stage<2?1.15:1.05,visible);
  if(reduced)return {x:origin.x,y:origin.y,scale:origin.scale};
  const left=Math.min(width*.28,size*.82),right=width-left;
  const top=Math.min(height*.4,size*.85+150),bottom=Math.max(top+1,height-size*.8-115);
  const cx=width/2,cy=(top+bottom)/2,rx=(right-left)/2,ry=(bottom-top)/2;
  if(stage<2){
    const centerX=lerp(origin.x,cx,visible),centerY=lerp(origin.y,cy,visible);
    const hops=Math.abs(Math.sin(t*Math.PI*(stage===0?3:4)));
    return {x:centerX+Math.sin(t*Math.PI*4)*(stage===0?28:48)*visible,y:centerY-hops*(stage===0?35:65)*visible,scale};
  }
  const q=Math.max(0,Math.min(1,(t-.14)/.72));
  const direction=seed%2?1:-1,angle=seed*2.399+direction*Math.PI*2*q;
  const reach=stage===2?.75:stage===3?.9:1;
  const wave=(swim?Math.sin(q*Math.PI*4)*14:fly?0:-Math.abs(Math.sin(q*Math.PI*(6+seed%3)))*20)*Math.sin(Math.PI*q);
  const loopX=cx+Math.cos(angle)*rx*reach;
  const loopY=cy+Math.sin(angle)*ry*reach+wave;
  const entry={x:cx+Math.cos(seed*2.399)*rx*reach,y:cy+Math.sin(seed*2.399)*ry*reach};
  if(t<.14)return {x:lerp(origin.x,entry.x,intro),y:lerp(origin.y,entry.y,intro),scale};
  if(t>.86)return {x:lerp(entry.x,origin.x,outro),y:lerp(entry.y,origin.y,outro),scale};
  return {x:Math.max(left,Math.min(right,loopX)),y:Math.max(top,Math.min(bottom,loopY)),scale};
}
window.PetEvolution = { profiles:EVOLUTION_PROFILES, names:PET_FORM_NAMES, profile:evolutionProfile, asset:evolutionAsset, pose:evolutionPose, parkPose:parkPerformancePose };
