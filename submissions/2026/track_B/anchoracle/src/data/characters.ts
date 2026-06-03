// 景点类型分类。决定该景点能匹配的视觉场景。
export type LandmarkType =
  | "故居" // former residence — 室内 / 民居院落
  | "纪念馆" // memorial hall — 室内陈列 + 馆舍建筑
  | "公园" // open park — 开阔草坪 / 雕塑 / 园林路径
  | "陵园" // mausoleum — 纪念广场 / 碑墓
  | "广场" // memorial square — 城市广场 + 雕塑
  | "园林" // classical garden — 江南园林
  | "古镇" // old town / cultural street
  | "校园" // university campus
  | "历史建筑" // standalone heritage building: 塔、楼、寺、教堂、城门、宫殿
  | "自然景观" // lake / mountain / river
  | "城市地标"; // 综合城市地段，外滩 / 徐家汇 / 海河

// 视觉场景关键词。Gemma 从图像中提取出哪几种，再和 sceneTypes 做交集打分。
export type SceneType =
  | "室内陈列"
  | "民居院落"
  | "开阔公园"
  | "纪念广场"
  | "园林"
  | "自然景观"
  | "城市街景"
  | "历史建筑"
  | "校园"
  | "古镇街区";

export interface Landmark {
  name: string;
  description: string;
  type: LandmarkType;
  sceneTypes: SceneType[];
}

export interface Character {
  id: string;
  name: string;
  title: string;
  era: string;
  avatar: string;
  intro: string;
  landmarks: Landmark[];
}

export interface City {
  id: string;
  name: string;
  description: string;
  image: string;
  characters: Character[];
}

export const cities: City[] = [
  {
    id: "hangzhou",
    name: "杭州",
    description: "上有天堂，下有苏杭",
    image: "/cities/hangzhou.jpg",
    characters: [
      {
        id: "sushi",
        name: "苏轼",
        title: "北宋文学家",
        era: "北宋（1037-1101）",
        avatar: "/avatars/sushi.jpg",
        intro: "曾任杭州知州，疏浚西湖，筑苏堤",
        landmarks: [
          { name: "西湖", description: "欲把西湖比西子，淡妆浓抹总相宜", type: "自然景观", sceneTypes: ["自然景观", "园林"] },
          { name: "苏堤", description: "苏轼任杭州知州时主持修建的长堤", type: "自然景观", sceneTypes: ["自然景观", "园林"] },
          { name: "苏东坡纪念馆", description: "位于西湖苏堤附近，纪念苏轼在杭功绩", type: "纪念馆", sceneTypes: ["室内陈列", "历史建筑"] },
        ],
      },
      {
        id: "zhukezhen",
        name: "竺可桢",
        title: "气象学家、浙江大学校长",
        era: "近现代（1890-1974）",
        avatar: "/avatars/zhukezhen.jpg",
        intro: "执掌浙大十三年，带领浙大成为东方剑桥",
        landmarks: [
          { name: "浙江大学", description: "竺可桢任校长期间的西迁办学传奇", type: "校园", sceneTypes: ["校园"] },
          { name: "竺可桢纪念馆", description: "位于浙大玉泉校区，展示其一生科学成就", type: "纪念馆", sceneTypes: ["室内陈列", "校园"] },
          { name: "杭州植物园", description: "竺可桢常在此观测物候，记录桃花始开日期", type: "公园", sceneTypes: ["开阔公园", "自然景观", "园林"] },
        ],
      },
      {
        id: "baijuyi",
        name: "白居易",
        title: "唐代诗人",
        era: "唐代（772-846）",
        avatar: "/avatars/baijuyi.jpg",
        intro: "任杭州刺史期间修筑白堤，留下大量西湖诗篇",
        landmarks: [
          { name: "白堤", description: "白居易任杭州刺史时主持修筑", type: "自然景观", sceneTypes: ["自然景观", "园林"] },
          { name: "孤山", description: "白居易常游之地，留有诗篇", type: "自然景观", sceneTypes: ["自然景观", "园林"] },
          { name: "钱塘江", description: "白居易写下多首观潮诗", type: "自然景观", sceneTypes: ["自然景观"] },
        ],
      },
    ],
  },
  {
    id: "wuxi",
    name: "无锡",
    description: "太湖明珠，鱼米之乡",
    image: "/cities/wuxi.jpg",
    characters: [
      {
        id: "gukaizhi",
        name: "顾恺之",
        title: "东晋画家",
        era: "东晋（348-409）",
        avatar: "/avatars/gukaizhi.jpg",
        intro: "无锡人，有「画绝、才绝、痴绝」之称",
        landmarks: [
          { name: "惠山古镇", description: "顾恺之故里，古镇内有相关遗迹", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
          { name: "锡惠公园", description: "惠山脚下的园林，与顾恺之时代渊源深厚", type: "公园", sceneTypes: ["开阔公园", "园林", "自然景观"] },
          { name: "太湖", description: "顾恺之笔下江南山水的灵感之源", type: "自然景观", sceneTypes: ["自然景观"] },
        ],
      },
      {
        id: "qianzhongshu",
        name: "钱钟书",
        title: "现代文学家、学者",
        era: "近现代（1910-1998）",
        avatar: "/avatars/qianzhongshu.jpg",
        intro: "无锡人，《围城》作者，学贯中西",
        landmarks: [
          { name: "钱钟书故居", description: "位于无锡新街巷，现为纪念馆", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "东林书院", description: "无锡著名书院，钱家有深厚的读书传统", type: "历史建筑", sceneTypes: ["历史建筑", "园林"] },
          { name: "南禅寺", description: "无锡老城区地标，钱钟书少年时常经之地", type: "历史建筑", sceneTypes: ["历史建筑", "古镇街区"] },
        ],
      },
      {
        id: "xuxiake",
        name: "徐霞客",
        title: "明代地理学家、旅行家",
        era: "明代（1587-1641）",
        avatar: "/avatars/xuxiake.jpg",
        intro: "江阴人，一生游历三十余年，著《徐霞客游记》",
        landmarks: [
          { name: "徐霞客故居", description: "位于江阴马镇，现为全国重点文保单位", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "徐霞客大道", description: "以徐霞客命名的城市主干道", type: "城市地标", sceneTypes: ["城市街景"] },
          { name: "晴山堂", description: "徐霞客故居内，存有明代84位名家石刻，全国重点文保单位", type: "历史建筑", sceneTypes: ["历史建筑", "室内陈列"] },
        ],
      },
    ],
  },
  {
    id: "nanjing",
    name: "南京",
    description: "六朝古都，虎踞龙盘",
    image: "/cities/nanjing.jpg",
    characters: [
      {
        id: "sunzhongshan",
        name: "孙中山",
        title: "中国民主革命先驱",
        era: "近现代（1866-1925）",
        avatar: "/avatars/sunzhongshan.jpg",
        intro: "在南京就任临时大总统，逝后安葬于中山陵",
        landmarks: [
          { name: "中山陵", description: "孙中山陵寝，位于紫金山南麓", type: "陵园", sceneTypes: ["纪念广场", "历史建筑", "自然景观"] },
          { name: "总统府", description: "孙中山就任临时大总统之地", type: "历史建筑", sceneTypes: ["历史建筑", "室内陈列", "园林"] },
          { name: "中山码头", description: "以孙中山命名，见证南京近代史", type: "城市地标", sceneTypes: ["城市街景", "自然景观"] },
        ],
      },
      {
        id: "libai",
        name: "李白",
        title: "唐代诗人",
        era: "唐代（701-762）",
        avatar: "/avatars/libai.jpg",
        intro: "多次游历金陵，留下「凤凰台上凤凰游」等名篇",
        landmarks: [
          { name: "凤凰台", description: "李白写下《登金陵凤凰台》之地", type: "历史建筑", sceneTypes: ["历史建筑", "园林"] },
          { name: "秦淮河", description: "李白诗中多次提及的金陵胜景", type: "自然景观", sceneTypes: ["自然景观", "城市街景"] },
          { name: "紫金山", description: "李白诗中的钟山，金陵形胜之地", type: "自然景观", sceneTypes: ["自然景观"] },
        ],
      },
      {
        id: "caoxueqin",
        name: "曹雪芹",
        title: "清代文学家",
        era: "清代（约1715-1763）",
        avatar: "/avatars/caoxueqin.jpg",
        intro: "少年时居于南京江宁织造府，《红楼梦》取材于此",
        landmarks: [
          { name: "江宁织造博物馆", description: "曹家旧址，曹雪芹少年成长之地", type: "纪念馆", sceneTypes: ["室内陈列", "历史建筑"] },
          { name: "乌衣巷", description: "曹雪芹幼时曾走过的古巷，兴衰之叹", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
          { name: "夫子庙", description: "秦淮风光带，曹雪芹笔下金陵繁华的缩影", type: "历史建筑", sceneTypes: ["历史建筑", "古镇街区", "城市街景"] },
        ],
      },
    ],
  },
  {
    id: "suzhou",
    name: "苏州",
    description: "人间天堂，园林之城",
    image: "/cities/suzhou.jpg",
    characters: [
      {
        id: "tangbohu",
        name: "唐伯虎",
        title: "明代画家、诗人",
        era: "明代（1470-1524）",
        avatar: "/avatars/tangbohu.jpg",
        intro: "苏州人，吴中四才子之一，民间惯称首位",
        landmarks: [
          { name: "桃花坞", description: "唐伯虎故居所在，「桃花坞里桃花庵」", type: "故居", sceneTypes: ["民居院落", "古镇街区"] },
          { name: "虎丘山", description: "唐伯虎常游之地，苏州标志性景点", type: "自然景观", sceneTypes: ["自然景观", "历史建筑"] },
          { name: "拙政园", description: "苏州最大的古典园林，明代始建", type: "园林", sceneTypes: ["园林"] },
        ],
      },
      {
        id: "fanzhongyan",
        name: "范仲淹",
        title: "北宋政治家、文学家",
        era: "北宋（989-1052）",
        avatar: "/avatars/fanzhongyan.jpg",
        intro: "苏州人，「先天下之忧而忧，后天下之乐而乐」",
        landmarks: [
          { name: "天平山", description: "范仲淹先祖归葬地，范公祠所在", type: "自然景观", sceneTypes: ["自然景观", "历史建筑"] },
          { name: "苏州文庙", description: "范仲淹创建的府学所在地", type: "历史建筑", sceneTypes: ["历史建筑"] },
          { name: "盘门", description: "苏州古城门，范仲淹治苏时的城防要地", type: "历史建筑", sceneTypes: ["历史建筑", "园林"] },
        ],
      },
      {
        id: "jinshengtan",
        name: "金圣叹",
        title: "明末清初文学评论家",
        era: "明末清初（1608-1661）",
        avatar: "/avatars/jinshengtan.jpg",
        intro: "苏州人，以评点《水浒传》《西厢记》闻名",
        landmarks: [
          { name: "沧浪亭", description: "苏州最古老的园林，金圣叹常来此处读书论文", type: "园林", sceneTypes: ["园林"] },
          { name: "山塘街", description: "苏州老街，金圣叹生活的市井气息", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
          { name: "寒山寺", description: "金圣叹点评过张继的《枫桥夜泊》", type: "历史建筑", sceneTypes: ["历史建筑"] },
        ],
      },
    ],
  },
  {
    id: "shanghai",
    name: "上海",
    description: "东方明珠，海纳百川",
    image: "/cities/shanghai.jpg",
    characters: [
      {
        id: "luxun-sh",
        name: "鲁迅",
        title: "现代文学家、思想家",
        era: "近现代（1881-1936）",
        avatar: "/avatars/luxun.jpg",
        intro: "晚年定居上海虹口，在此度过人生最后十年",
        landmarks: [
          { name: "鲁迅故居", description: "位于山阴路，鲁迅最后的居所", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "鲁迅公园", description: "鲁迅常散步之地，园内有鲁迅墓与鲁迅坐像", type: "公园", sceneTypes: ["开阔公园", "园林", "纪念广场"] },
          { name: "多伦路文化街", description: "鲁迅等左翼文人活动的据点", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
        ],
      },
      {
        id: "songqingling",
        name: "宋庆龄",
        title: "革命家、社会活动家",
        era: "近现代（1893-1981）",
        avatar: "/avatars/songqingling.jpg",
        intro: "长期居住上海，致力于妇女儿童福利事业",
        landmarks: [
          { name: "宋庆龄故居", description: "位于淮海中路，现为纪念馆", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "孙中山故居", description: "香山路7号，宋庆龄与孙中山共同生活之地", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "外滩", description: "见证上海近现代变迁的标志性景观", type: "城市地标", sceneTypes: ["城市街景", "自然景观"] },
        ],
      },
      {
        id: "xuguangqi",
        name: "徐光启",
        title: "明代科学家、政治家",
        era: "明代（1562-1633）",
        avatar: "/avatars/xuguangqi.jpg",
        intro: "上海人，徐家汇因其家族而得名",
        landmarks: [
          { name: "徐家汇", description: "因徐光启家族而得名的上海核心区域", type: "城市地标", sceneTypes: ["城市街景"] },
          { name: "徐光启纪念馆", description: "位于南丹路光启公园内", type: "纪念馆", sceneTypes: ["室内陈列", "开阔公园", "纪念广场"] },
          { name: "徐家汇天主教堂", description: "与徐光启引入天主教的历史有关", type: "历史建筑", sceneTypes: ["历史建筑"] },
        ],
      },
    ],
  },
  {
    id: "beijing",
    name: "北京",
    description: "千年帝都，文脉之源",
    image: "/cities/beijing.jpg",
    characters: [
      {
        id: "laoshe",
        name: "老舍",
        title: "现代文学家",
        era: "现代（1899-1966）",
        avatar: "/avatars/laoshe.jpg",
        intro: "写了一辈子北京城的舒庆春，满身都是胡同里的槐花香与太平鼓声",
        landmarks: [
          { name: "老舍故居", description: "老舍1949年后定居并创作《茶馆》等名作的四合院，因两株手植柿树得名'丹柿小院'", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "老舍茶馆", description: "以老舍名剧命名，汇聚京味戏曲与茶文化", type: "纪念馆", sceneTypes: ["室内陈列", "城市街景"] },
          { name: "北京人民艺术剧院", description: "老舍是北京人艺核心编剧，《茶馆》《龙须沟》在此首演并成为保留剧目", type: "历史建筑", sceneTypes: ["历史建筑", "城市街景"] },
        ],
      },
      {
        id: "meilanfang",
        name: "梅兰芳",
        title: "京剧艺术大师",
        era: "现代（1894-1961）",
        avatar: "/avatars/meilanfang.jpg",
        intro: "一生在氍毹之上演绎千古红颜，愿以梨园技艺与诸君共赏东方艺术之静穆与庄严",
        landmarks: [
          { name: "梅兰芳纪念馆", description: "梅兰芳晚年居住的二进四合院，保存有其生活原貌及大量珍贵戏装、手稿", type: "纪念馆", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "长安大戏院", description: "梅兰芳长期演出的重要舞台，在此对《凤还巢》等传统剧目进行了多处艺术革新", type: "历史建筑", sceneTypes: ["历史建筑", "城市街景"] },
          { name: "颐和园", description: "梅兰芳常在此园中游赏取景，园内山水与其古典唯美的舞台意境在精神上相通", type: "园林", sceneTypes: ["园林", "开阔公园", "自然景观", "历史建筑"] },
        ],
      },
      {
        id: "jixiaolan",
        name: "纪晓岚",
        title: "清代才子、《四库全书》总纂官",
        era: "清代（1724-1805）",
        avatar: "/avatars/jixiaolan.jpg",
        intro: "河间纪昀，在红墙内总纂四库，在草堂中记叙阅微世界的狐鬼故事",
        landmarks: [
          { name: "纪晓岚故居", description: "纪晓岚居住六十余载之所，院内紫藤海棠依然", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "琉璃厂古文化街", description: "清代文人汇聚之地，纪晓岚编纂《四库全书》期间常在此搜罗秘本残卷", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
          { name: "故宫", description: "纪晓岚长期在紫禁城内当差，文渊阁的藏书楼见证了他巅峰的学术成就", type: "历史建筑", sceneTypes: ["历史建筑", "室内陈列"] },
        ],
      },
    ],
  },
  {
    id: "tianjin",
    name: "天津",
    description: "海河潮涌，近代启蒙之城",
    image: "/cities/tianjin.jpg",
    characters: [
      {
        id: "lishutong",
        name: "李叔同",
        title: "艺术家、弘一法师",
        era: "近代（1880-1942）",
        avatar: "/avatars/lishutong.jpg",
        intro: "曾是翩翩津门才子，亦是静穆佛门高僧，终在长亭古道外寻得一心安处",
        landmarks: [
          { name: "李叔同故居纪念馆", description: "位于海河东岸的'李家大院'，是其出生及青少年成长之地", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "望海楼天主堂", description: "教堂附近的狮子林桥一带是李叔同少年常去之所，见证近代天津中西文化碰撞", type: "历史建筑", sceneTypes: ["历史建筑"] },
          { name: "海河", description: "贯穿天津的母亲河，李叔同少年时期曾在此感悟城市变迁", type: "自然景观", sceneTypes: ["自然景观", "城市街景"] },
        ],
      },
      {
        id: "huoyuanjia",
        name: "霍元甲",
        title: "武术宗师、精武体育会创始人",
        era: "清末（1868-1910）",
        avatar: "/avatars/huoyuanjia.jpg",
        intro: "出身小南河村一介武夫，愿凭迷踪拳法洗雪'东亚病夫'之耻",
        landmarks: [
          { name: "霍元甲故居", description: "霍元甲出生地及练习'秘宗拳'旧址", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "霍元甲陵园", description: "武术宗师最终长眠之地，园内立有'尚武精神'碑匾（相传为孙中山先生所题）", type: "陵园", sceneTypes: ["纪念广场", "开阔公园"] },
          { name: "天津老城厢", description: "霍元甲早年在津门开设武馆、威震海内外的社会活动中心", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
        ],
      },
      {
        id: "yanfu",
        name: "严复",
        title: "近代思想家、翻译家",
        era: "近代（1854-1921）",
        avatar: "/avatars/yanfu.jpg",
        intro: "自西洋归来，于北洋学堂二十载，终生求索维新之路",
        landmarks: [
          { name: "天演广场", description: "为纪念严复在津翻译《天演论》而建的现代文化广场，铸有严复铜像", type: "广场", sceneTypes: ["纪念广场", "开阔公园", "城市街景"] },
          { name: "梁启超饮冰室书斋", description: "梁启超旧居中的书房，严复与梁启超同为维新派核心，二人在津门多有往来", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "北洋大学堂旧址", description: "严复曾参与此校早期筹建，见证了天津作为中国近代高等教育策源地的历史", type: "校园", sceneTypes: ["历史建筑", "校园"] },
        ],
      },
    ],
  },
  {
    id: "chongqing",
    name: "重庆",
    description: "忠义山城，英雄之都",
    image: "/cities/chongqing.jpg",
    characters: [
      {
        id: "qinliangyu",
        name: "秦良玉",
        title: "明代女将军",
        era: "明末（1574-1648）",
        avatar: "/avatars/qinliangyu.jpg",
        intro: "虽身为女子，亦能统领白杆精兵，护石柱一方太平，卫大明社稷",
        landmarks: [
          { name: "秦良玉陵园", description: "巾帼英雄的归宿之地，保存有大量封号碑刻", type: "陵园", sceneTypes: ["纪念广场", "历史建筑"] },
          { name: "万寿山", description: "秦良玉屯兵御敌的万寿寨所在地，现为国家AAAA级景区，保留有古寨门、城墙、练兵场等遗址", type: "自然景观", sceneTypes: ["自然景观", "历史建筑"] },
          { name: "三峡", description: "秦良玉曾率部在此区域多次阻击敌军，峡江一带广为流传其英勇事迹", type: "自然景观", sceneTypes: ["自然景观"] },
        ],
      },
      {
        id: "zourong",
        name: "邹容",
        title: "革命先驱",
        era: "清末（1885-1905）",
        avatar: "/avatars/zourong.jpg",
        intro: "'革命军中马前卒'，年方十八便敢提笔直指皇权",
        landmarks: [
          { name: "邹容公园", description: "原名南区公园，园内矗立着烈士纪念碑", type: "公园", sceneTypes: ["开阔公园", "纪念广场"] },
          { name: "邹容烈士纪念碑", description: "碑文由章太炎撰写，记叙了邹容撰写《革命军》的生平", type: "广场", sceneTypes: ["纪念广场", "开阔公园"] },
          { name: "朝天门", description: "重庆门户，见证了少年邹容乘船东出峡江远赴东瀛寻求救国真理", type: "城市地标", sceneTypes: ["城市街景", "自然景观"] },
        ],
      },
      {
        id: "luzuofu",
        name: "卢作孚",
        title: "实业家、民生公司创始人",
        era: "现代（1893-1952）",
        avatar: "/avatars/luzuofu.jpg",
        intro: "一生致力于实业、教育与乡村建设，愿以民生航运为帆，在激流中开辟出华夏富强之路",
        landmarks: [
          { name: "卢作孚故居", description: "卢作孚回合川筹组民生公司时的居所，中国近代民营航运的摇篮", type: "故居", sceneTypes: ["民居院落", "室内陈列"] },
          { name: "重庆自然博物馆", description: "由卢作孚创办的中国西部科学院旧址，见证其以科学救国的热忱", type: "纪念馆", sceneTypes: ["室内陈列", "历史建筑"] },
          { name: "北碚公园", description: "卢作孚乡村建设的代表作，民国时期乡村改革与城镇规划的典范", type: "公园", sceneTypes: ["开阔公园", "园林"] },
        ],
      },
    ],
  },
  {
    id: "wuhan",
    name: "武汉",
    description: "江汉交汇，荆楚浪漫",
    image: "/cities/wuhan.jpg",
    characters: [
      {
        id: "quyuan",
        name: "屈原",
        title: "战国爱国诗人",
        era: "战国（约前340-前278）",
        avatar: "/avatars/quyuan.jpg",
        intro: "身披香草，腰佩长剑，于江潭行吟，纵然九死其犹未悔",
        landmarks: [
          { name: "行吟阁", description: "为纪念屈原'行吟泽畔'而建，阁前立有其翘首向天的雕像", type: "纪念馆", sceneTypes: ["历史建筑", "纪念广场", "园林"] },
          { name: "屈原纪念馆", description: "位于东湖听涛景区内，系统陈列了屈原的作品及楚辞文化", type: "纪念馆", sceneTypes: ["室内陈列"] },
          { name: "东湖风景区", description: "景观设计深受楚文化影响，漫步湖岸可感悟屈原诗作的浪漫与哀愁", type: "自然景观", sceneTypes: ["自然景观", "开阔公园"] },
        ],
      },
      {
        id: "zhangzhidong",
        name: "张之洞",
        title: "清末重臣、洋务运动代表",
        era: "清末（1837-1909）",
        avatar: "/avatars/zhangzhidong.jpg",
        intro: "主鄂十八载，兴汉阳铁厂，办自强学堂，为华夏开工业之基",
        landmarks: [
          { name: "张之洞纪念馆", description: "坐落于汉阳，展示了张之洞在汉创办铁厂、发展近代工业的功绩", type: "纪念馆", sceneTypes: ["室内陈列", "历史建筑"] },
          { name: "武汉大学", description: "张之洞1893年奏请开办自强学堂（武大前身），开启湖北近代教育先河", type: "校园", sceneTypes: ["校园", "历史建筑"] },
          { name: "汉阳兵工厂", description: "洋务运动的杰作，生产的'汉阳造'步枪影响了中国战史", type: "历史建筑", sceneTypes: ["历史建筑", "室内陈列"] },
        ],
      },
      {
        id: "cuihao",
        name: "崔颢",
        title: "唐代诗人",
        era: "唐代（704-754）",
        avatar: "/avatars/cuihao.jpg",
        intro: "昔日黄鹤一去，白云千载。于楼头俯瞰晴川，留此一首绝唱",
        landmarks: [
          { name: "黄鹤楼", description: "崔颢在此留下千古绝唱，即便李白登楼也曾感慨'题诗在上头'而弃笔", type: "历史建筑", sceneTypes: ["历史建筑"] },
          { name: "蛇山", description: "黄鹤楼所在地，崔颢诗中'晴川历历汉阳树'即是登此山俯瞰江对岸的写照", type: "自然景观", sceneTypes: ["自然景观"] },
          { name: "鹦鹉洲", description: "因崔颢名句'芳草萋萋鹦鹉洲'而广为人知", type: "自然景观", sceneTypes: ["自然景观"] },
        ],
      },
    ],
  },
  {
    id: "chengdu",
    name: "成都",
    description: "锦官城里，诗意栖居",
    image: "/cities/chengdu.jpg",
    characters: [
      {
        id: "dufu",
        name: "杜甫",
        title: "唐代诗人",
        era: "唐代（712-770）",
        avatar: "/avatars/dufu.jpg",
        intro: "飘泊半生，终得浣花溪畔一角栖身，心犹系天下寒士",
        landmarks: [
          { name: "杜甫草堂", description: "杜甫在此居住四年并创作240余首诗歌，是其一生中少有的安稳岁月", type: "故居", sceneTypes: ["民居院落", "园林", "历史建筑"] },
          { name: "浣花溪公园", description: "紧邻草堂，杜甫诗中'清江一曲抱村流'所在地", type: "公园", sceneTypes: ["开阔公园", "自然景观", "园林"] },
          { name: "望江楼公园", description: "纪念唐代女诗人薛涛的园林，与杜甫诗歌文化一脉相承", type: "公园", sceneTypes: ["开阔公园", "园林"] },
        ],
      },
      {
        id: "zhugeliang",
        name: "诸葛亮",
        title: "蜀汉丞相",
        era: "三国（181-234）",
        avatar: "/avatars/zhugeliang.jpg",
        intro: "托孤受命，鞠躬尽瘁，志在兴复汉室",
        landmarks: [
          { name: "成都武侯祠博物馆", description: "中国唯一的君臣合祀祠庙，刘备之墓与诸葛亮之殿在此并立", type: "纪念馆", sceneTypes: ["历史建筑", "园林", "室内陈列"] },
          { name: "锦里", description: "相传起源于蜀汉时期，是诸葛亮治理下成都商业繁荣的缩影", type: "古镇", sceneTypes: ["古镇街区", "城市街景"] },
          { name: "万里桥", description: "诸葛亮送费祎出使东吴时'万里之行始于此'的典故地", type: "历史建筑", sceneTypes: ["历史建筑", "城市街景"] },
        ],
      },
      {
        id: "bajin",
        name: "巴金",
        title: "现代文学巨匠",
        era: "现代（1904-2005）",
        avatar: "/avatars/bajin.jpg",
        intro: "从成都正通顺街的高墙大院中出走，用文字控诉封建礼教，用余生践行“讲真话”的诺言",
        landmarks: [
          { name: "巴金故居原址", description: "巴金出生地及《家》中高公馆原型，原建筑虽已不存，但原址纪念标识与周边街巷仍保留着旧日痕迹", type: "故居", sceneTypes: ["民居院落", "城市街景"] },
          { name: "双眼井", description: "李公馆门外的地理标志，巴金童年记忆的锚点，现为区级文物保护单位", type: "历史建筑", sceneTypes: ["城市街景", "历史建筑"] },
          { name: "百花潭公园·慧园", description: "以小说《家》中高公馆为蓝本重建的川西民居，巴金曾亲自寻访并捐赠旧物", type: "公园", sceneTypes: ["开阔公园", "园林", "民居院落"] },
        ],
      },
    ],
  },
];
