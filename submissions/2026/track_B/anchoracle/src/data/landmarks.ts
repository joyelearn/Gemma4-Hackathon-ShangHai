export interface LandmarkInfo {
  openingHours: string;
  ticketPrice: string;
  transport: string;
  address: string;
}

export const landmarkData: Record<string, LandmarkInfo> = {
  // === 杭州 ===
  "西湖": {
    openingHours: "全天开放，各小景点时间不同",
    ticketPrice: "免费开放，游船约55元/人",
    transport: "地铁1号线龙翔桥站步行约10分钟",
    address: "浙江省杭州市西湖区龙井路1号",
  },
  "苏堤": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "公交4路、315路苏堤站下车",
    address: "浙江省杭州市西湖区苏堤",
  },
  "苏东坡纪念馆": {
    openingHours: "8:30-16:30，周一闭馆",
    ticketPrice: "免费",
    transport: "公交4路、315路苏堤站下车步行5分钟",
    address: "浙江省杭州市西湖区南山路苏堤南端",
  },
  "浙江大学": {
    openingHours: "校园全天开放，需预约入校",
    ticketPrice: "免费",
    transport: "地铁2号线虾龙圩站（玉泉校区）",
    address: "浙江省杭州市西湖区余杭塘路866号",
  },
  "竺可桢纪念馆": {
    openingHours: "8:30-17:00，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁2号线虾龙圩站步行至浙大玉泉校区内",
    address: "浙江省杭州市西湖区浙大玉泉校区内",
  },
  "杭州植物园": {
    openingHours: "7:00-17:30（冬季7:00-17:00）",
    ticketPrice: "10元",
    transport: "公交28路植物园站，临近浙大玉泉校区",
    address: "浙江省杭州市西湖区桃源岭1号",
  },
  "白堤": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "公交K7路断桥站下车",
    address: "浙江省杭州市西湖区白堤",
  },
  "孤山": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "公交K7路岳庙站下车步行5分钟",
    address: "浙江省杭州市西湖区孤山路",
  },
  "钱塘江": {
    openingHours: "全天开放（观潮最佳：农历八月十八前后）",
    ticketPrice: "免费",
    transport: "地铁1号线城站站转公交至六和塔",
    address: "浙江省杭州市钱塘江沿岸",
  },

  // === 无锡 ===
  "惠山古镇": {
    openingHours: "8:30-17:00",
    ticketPrice: "免费进入，部分祠堂联票70元",
    transport: "地铁4号线惠山古镇站",
    address: "江苏省无锡市梁溪区惠山直街",
  },
  "锡惠公园": {
    openingHours: "6:00-17:30",
    ticketPrice: "联票70元（含天下第二泉、惠山寺等）",
    transport: "地铁4号线惠山古镇站步行5分钟",
    address: "江苏省无锡市梁溪区惠山直街2号",
  },
  "太湖": {
    openingHours: "全天开放（鼋头渚景区7:00-17:30）",
    ticketPrice: "鼋头渚门票90元（含船票）",
    transport: "公交1路至鼋头渚风景区",
    address: "江苏省无锡市滨湖区鼋渚路",
  },
  "钱钟书故居": {
    openingHours: "9:00-17:00，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁1号线三阳广场站步行10分钟",
    address: "江苏省无锡市梁溪区新街巷30号",
  },
  "东林书院": {
    openingHours: "8:30-17:00",
    ticketPrice: "免费",
    transport: "地铁1号线三阳广场站步行15分钟",
    address: "江苏省无锡市梁溪区解放东路867号",
  },
  "南禅寺": {
    openingHours: "7:30-17:00",
    ticketPrice: "免费",
    transport: "地铁1号线南禅寺站",
    address: "江苏省无锡市梁溪区向阳路32号",
  },
  "徐霞客故居": {
    openingHours: "8:30-17:00",
    ticketPrice: "免费",
    transport: "江阴市区公交至马镇",
    address: "江苏省江阴市徐霞客镇",
  },
  "徐霞客大道": {
    openingHours: "全天开放（城市道路）",
    ticketPrice: "免费",
    transport: "江阴市区公交可达",
    address: "江苏省江阴市徐霞客大道",
  },
  "晴山堂": {
    openingHours: "8:30-17:00",
    ticketPrice: "免费（含在徐霞客故居景区内）",
    transport: "江阴市区公交至马镇徐霞客故居",
    address: "江苏省江阴市徐霞客镇徐霞客故居内",
  },

  // === 南京 ===
  "中山陵": {
    openingHours: "8:30-17:00，周一闭馆（需预约）",
    ticketPrice: "免费（需提前预约）",
    transport: "地铁2号线苜蓿园站转景区公交",
    address: "江苏省南京市玄武区石象路7号",
  },
  "总统府": {
    openingHours: "8:30-17:00，周一闭馆",
    ticketPrice: "35元",
    transport: "地铁2号线/3号线大行宫站",
    address: "江苏省南京市玄武区长江路292号",
  },
  "中山码头": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁1号线鼓楼站转公交至中山码头",
    address: "江苏省南京市鼓楼区中山北路尽头",
  },
  "凤凰台": {
    openingHours: "全天开放（遗址公园）",
    ticketPrice: "免费",
    transport: "地铁1号线三山街站步行10分钟",
    address: "江苏省南京市秦淮区凤游寺附近",
  },
  "秦淮河": {
    openingHours: "全天开放（画舫19:00-22:00）",
    ticketPrice: "河岸免费，画舫约80元/人",
    transport: "地铁1号线三山街站或地铁3号线夫子庙站",
    address: "江苏省南京市秦淮区",
  },
  "紫金山": {
    openingHours: "全天开放",
    ticketPrice: "免费（明孝陵等景点另收费）",
    transport: "地铁2号线苜蓿园站",
    address: "江苏省南京市玄武区",
  },
  "江宁织造博物馆": {
    openingHours: "9:00-17:30，周一闭馆",
    ticketPrice: "30元",
    transport: "地铁1号线大行宫站步行5分钟",
    address: "江苏省南京市玄武区长江路123号",
  },
  "乌衣巷": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁3号线夫子庙站步行5分钟",
    address: "江苏省南京市秦淮区乌衣巷",
  },
  "夫子庙": {
    openingHours: "9:00-22:00",
    ticketPrice: "大成殿30元，景区免费",
    transport: "地铁3号线夫子庙站",
    address: "江苏省南京市秦淮区贡院西街",
  },

  // === 苏州 ===
  "桃花坞": {
    openingHours: "全天开放（街区）",
    ticketPrice: "免费",
    transport: "地铁2号线石路站步行10分钟",
    address: "江苏省苏州市姑苏区桃花坞大街",
  },
  "虎丘山": {
    openingHours: "7:30-17:30（冬季7:30-17:00）",
    ticketPrice: "60元（旺季80元）",
    transport: "公交32路至虎丘首末站",
    address: "江苏省苏州市姑苏区虎丘山门内8号",
  },
  "沧浪亭": {
    openingHours: "7:30-17:30（冬季7:30-17:00）",
    ticketPrice: "15元",
    transport: "地铁4号线三元坊站步行5分钟",
    address: "江苏省苏州市姑苏区沧浪亭街3号",
  },
  "拙政园": {
    openingHours: "7:30-17:30（冬季7:30-17:00）",
    ticketPrice: "旺季70元，淡季50元",
    transport: "地铁4号线北寺塔站步行10分钟",
    address: "江苏省苏州市姑苏区东北街178号",
  },
  "天平山": {
    openingHours: "8:00-17:00",
    ticketPrice: "30元（红枫季节可能调整）",
    transport: "公交4路至天平山站",
    address: "江苏省苏州市吴中区灵天路",
  },
  "苏州文庙": {
    openingHours: "9:00-17:00，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁4号线三元坊站步行5分钟",
    address: "江苏省苏州市姑苏区人民路613号",
  },
  "盘门": {
    openingHours: "7:30-17:00",
    ticketPrice: "40元",
    transport: "公交39路、305路盘门景区站",
    address: "江苏省苏州市姑苏区东大街1号",
  },
  "山塘街": {
    openingHours: "全天开放（商铺约9:00-22:00）",
    ticketPrice: "免费",
    transport: "地铁2号线山塘街站",
    address: "江苏省苏州市姑苏区山塘街",
  },
  "寒山寺": {
    openingHours: "7:30-17:00",
    ticketPrice: "20元",
    transport: "公交33路、44路寒山寺站",
    address: "江苏省苏州市姑苏区寒山寺弄24号",
  },

  // === 上海 ===
  "鲁迅故居": {
    openingHours: "9:00-16:00，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁3号线虹口足球场站步行10分钟",
    address: "上海市虹口区山阴路132弄9号",
  },
  "鲁迅公园": {
    openingHours: "6:00-18:00（冬季6:00-17:00）",
    ticketPrice: "免费",
    transport: "地铁3号线/8号线虹口足球场站",
    address: "上海市虹口区四川北路2288号",
  },
  "多伦路文化街": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁3号线东宝兴路站步行5分钟",
    address: "上海市虹口区多伦路",
  },
  "宋庆龄故居": {
    openingHours: "9:00-16:30，周一闭馆",
    ticketPrice: "20元",
    transport: "地铁10号线/11号线交通大学站步行10分钟",
    address: "上海市徐汇区淮海中路1843号",
  },
  "孙中山故居": {
    openingHours: "9:00-16:30，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁13号线淮海中路站步行5分钟",
    address: "上海市黄浦区香山路7号",
  },
  "外滩": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁2号线/10号线南京东路站",
    address: "上海市黄浦区中山东一路",
  },
  "徐家汇": {
    openingHours: "全天开放（商圈）",
    ticketPrice: "免费",
    transport: "地铁1号线/9号线/11号线徐家汇站",
    address: "上海市徐汇区徐家汇",
  },
  "徐光启纪念馆": {
    openingHours: "9:00-16:30，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁1号线/4号线上海体育馆站步行10分钟",
    address: "上海市徐汇区南丹路17号光启公园内",
  },
  "徐家汇天主教堂": {
    openingHours: "9:00-16:00（弥撒时间不对外开放）",
    ticketPrice: "免费",
    transport: "地铁1号线/9号线/11号线徐家汇站步行5分钟",
    address: "上海市徐汇区蒲西路158号",
  },

  // === 北京 ===
  "老舍故居": {
    openingHours: "9:00-17:00，周二至周日（周一闭馆）",
    ticketPrice: "免费",
    transport: "地铁5号线灯市口站步行约10分钟",
    address: "北京市东城区灯市口西街丰富胡同19号",
  },
  "老舍茶馆": {
    openingHours: "演出时间不同，通常14:00-21:30",
    ticketPrice: "演出票价不等，综合演出约100-380元",
    transport: "地铁2号线前门站步行5分钟",
    address: "北京市西城区前门西大街正阳市场3号楼",
  },
  "北京人民艺术剧院": {
    openingHours: "演出时间不同，通常19:30开演",
    ticketPrice: "演出票价不等，约80-680元",
    transport: "地铁1号线/5号线东单站或灯市口站步行约5分钟",
    address: "北京市东城区王府井大街22号",
  },
  "梅兰芳纪念馆": {
    openingHours: "9:00-16:30，周二至周日（周一闭馆）",
    ticketPrice: "10元",
    transport: "地铁2号线/6号线车公庄站步行约15分钟",
    address: "北京市西城区护国寺街9号",
  },
  "长安大戏院": {
    openingHours: "演出时间不同，通常19:15开演",
    ticketPrice: "演出票价不等，约80-880元",
    transport: "地铁1号线/5号线东单站步行约5分钟",
    address: "北京市东城区建国门内大街7号",
  },
  "颐和园": {
    openingHours: "6:30-18:00（旺季）/ 7:00-17:00（淡季）",
    ticketPrice: "旺季30元/淡季20元，联票60/50元",
    transport: "地铁4号线北宫门站",
    address: "北京市海淀区新建宫门路19号",
  },
  "纪晓岚故居": {
    openingHours: "9:00-17:00（暂不定期开放，建议提前确认）",
    ticketPrice: "免费",
    transport: "地铁7号线虎坊桥站步行约5分钟",
    address: "北京市西城区珠市口西大街241号",
  },
  "琉璃厂古文化街": {
    openingHours: "全天开放（商铺约9:00-18:00）",
    ticketPrice: "免费",
    transport: "地铁7号线虎坊桥站步行约5分钟",
    address: "北京市西城区琉璃厂东街/西街",
  },
  "故宫": {
    openingHours: "8:30-16:30（周一闭馆，需预约）",
    ticketPrice: "旺季60元/淡季40元",
    transport: "地铁1号线天安门东站",
    address: "北京市东城区景山前街4号",
  },

  // === 天津 ===
  "李叔同故居纪念馆": {
    openingHours: "9:00-17:00，周二至周日（周一闭馆）",
    ticketPrice: "免费",
    transport: "地铁9号线大王庄站步行约15分钟",
    address: "天津市河北区海河东路与滨海道交口",
  },
  "望海楼天主堂": {
    openingHours: "9:00-17:00",
    ticketPrice: "免费",
    transport: "公交5路、8路望海楼站",
    address: "天津市河北区狮子林大街292号",
  },
  "海河": {
    openingHours: "全天开放（游船约18:00-21:00）",
    ticketPrice: "河岸免费，游船约80-100元/人",
    transport: "地铁多条线路均可到达海河沿线",
    address: "天津市海河沿岸（天津之眼至海河外滩公园段最佳）",
  },
  "霍元甲故居": {
    openingHours: "8:30-16:30",
    ticketPrice: "免费",
    transport: "乘公交至精武镇小南河村",
    address: "天津市西青区精武镇小南河村",
  },
  "霍元甲陵园": {
    openingHours: "8:00-16:30",
    ticketPrice: "60元（含精武门·中华武林园）",
    transport: "乘公交至精武镇",
    address: "天津市西青区精武镇小南河村",
  },
  "天津老城厢": {
    openingHours: "全天开放（街区）",
    ticketPrice: "免费",
    transport: "地铁2号线鼓楼站",
    address: "天津市南开区鼓楼一带",
  },
  "天演广场": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁2号线东南角站步行约10分钟",
    address: "天津市南开区古文化街附近",
  },
  "梁启超饮冰室书斋": {
    openingHours: "9:00-16:30，周二至周日（周一闭馆）",
    ticketPrice: "免费",
    transport: "地铁1号线小白楼站步行约10分钟",
    address: "天津市河北区民族路46号",
  },
  "北洋大学堂旧址": {
    openingHours: "校园开放，旧址建筑外观可参观",
    ticketPrice: "免费",
    transport: "地铁1号线西横堤站步行约15分钟",
    address: "天津市红桥区光荣道2号（河北工业大学内）",
  },

  // === 重庆 ===
  "秦良玉陵园": {
    openingHours: "8:00-17:00",
    ticketPrice: "5元",
    transport: "石柱县城内乘公交至三教寺",
    address: "重庆市石柱土家族自治县南宾镇三教寺",
  },
  "万寿山": {
    openingHours: "9:00-17:30",
    ticketPrice: "65元（部分平台团购约35元起）",
    transport: "沪渝高速石柱东出口下，距出口约10公里；距石柱动车站约15公里",
    address: "重庆市石柱土家族自治县三河镇牛栏坪",
  },
  "三峡": {
    openingHours: "全天开放（游船班次固定）",
    ticketPrice: "因景点和游船不同而异，三峡游船约800-3000元/人",
    transport: "重庆朝天门码头登船，或万州/奉节出发",
    address: "重庆市至湖北宜昌段长江三峡（瞿塘峡、巫峡、西陵峡）",
  },
  "邹容公园": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "轨道交通1号线七星岗站步行约10分钟",
    address: "重庆市渝中区邹容路",
  },
  "邹容烈士纪念碑": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "轨道交通1号线七星岗站步行约10分钟",
    address: "重庆市渝中区邹容路（邹容公园内）",
  },
  "朝天门": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "轨道交通1号线/6号线小什字站步行约10分钟",
    address: "重庆市渝中区朝天门码头",
  },
  "卢作孚故居": {
    openingHours: "9:00-12:00, 14:00-17:00（周一闭馆）",
    ticketPrice: "免费",
    transport: "合川城区内公交可达文华街",
    address: "重庆市合川区文华街61号",
  },
  "重庆自然博物馆": {
    openingHours: "9:00-17:00，周二至周日（周一闭馆）",
    ticketPrice: "免费",
    transport: "轨道交通6号线状元碑站换乘583路",
    address: "重庆市北碚区金华路398号",
  },
  "北碚公园": {
    openingHours: "6:00-21:00",
    ticketPrice: "免费",
    transport: "轨道交通6号线北碚站步行约10分钟",
    address: "重庆市北碚区碚峡路106号",
  },

  // === 武汉 ===
  "行吟阁": {
    openingHours: "8:30-17:30",
    ticketPrice: "免费（东湖听涛景区内）",
    transport: "公交402路/411路至东湖听涛景区",
    address: "湖北省武汉市武昌区东湖听涛景区内",
  },
  "屈原纪念馆": {
    openingHours: "8:30-18:30",
    ticketPrice: "免费",
    transport: "公交402路至东湖听涛景区",
    address: "湖北省武汉市武昌区东湖听涛景区内",
  },
  "东湖风景区": {
    openingHours: "全天开放（磨山景区7:30-17:30）",
    ticketPrice: "听涛景区免费，磨山景区60元",
    transport: "地铁8号线梨园站（听涛景区）",
    address: "湖北省武汉市武昌区东湖路",
  },
  "张之洞纪念馆": {
    openingHours: "9:00-17:00，周一闭馆",
    ticketPrice: "免费",
    transport: "地铁6号线琴台站步行约10分钟",
    address: "湖北省武汉市汉阳区琴台大道169号",
  },
  "武汉大学": {
    openingHours: "校园全天开放，樱花季需预约",
    ticketPrice: "免费（樱花季预约入校）",
    transport: "地铁2号线街道口站步行约15分钟",
    address: "湖北省武汉市武昌区八一路299号",
  },
  "汉阳兵工厂": {
    openingHours: "外观全天可观，内部不定期开放",
    ticketPrice: "免费",
    transport: "公交531路至龟山北路",
    address: "湖北省武汉市汉阳区龟山北路",
  },
  "黄鹤楼": {
    openingHours: "8:30-18:00",
    ticketPrice: "65元",
    transport: "地铁5号线司门口黄鹤楼站步行约10分钟",
    address: "湖北省武汉市武昌区蛇山西山坡特1号",
  },
  "蛇山": {
    openingHours: "全天开放",
    ticketPrice: "免费（黄鹤楼景区另收费）",
    transport: "地铁5号线司门口黄鹤楼站",
    address: "湖北省武汉市武昌区蛇山",
  },
  "鹦鹉洲": {
    openingHours: "全天开放",
    ticketPrice: "免费",
    transport: "地铁6号线琴台站或公交至鹦鹉洲大桥",
    address: "湖北省武汉市汉阳区鹦鹉洲",
  },

  // === 成都 ===
  "杜甫草堂": {
    openingHours: "9:00-18:00（17:00停止入园）",
    ticketPrice: "50元",
    transport: "地铁4号线草堂北路站步行约10分钟",
    address: "四川省成都市青羊区青华路37号",
  },
  "浣花溪公园": {
    openingHours: "6:00-22:00",
    ticketPrice: "免费",
    transport: "地铁4号线草堂北路站步行约5分钟",
    address: "四川省成都市青羊区青华路",
  },
  "望江楼公园": {
    openingHours: "园林区全天开放，文物区9:00-18:00",
    ticketPrice: "园林区免费，文物区20元",
    transport: "地铁6号线望江路站步行约10分钟",
    address: "四川省成都市武侯区望江路30号",
  },
  "成都武侯祠博物馆": {
    openingHours: "8:30-18:30（18:00停止入馆）",
    ticketPrice: "50元",
    transport: "地铁3号线高升桥站步行约10分钟",
    address: "四川省成都市武侯区武侯祠大街231号",
  },
  "锦里": {
    openingHours: "全天开放（商铺约9:00-22:00）",
    ticketPrice: "免费",
    transport: "地铁3号线高升桥站步行约10分钟",
    address: "四川省成都市武侯区武侯祠大街231号附",
  },
  "万里桥": {
    openingHours: "全天开放（城市桥梁）",
    ticketPrice: "免费",
    transport: "地铁3号线/5号线南熏大道站步行约10分钟",
    address: "四川省成都市武侯区老南门大桥一带",
  },
  "巴金故居原址": {
    openingHours: "全天开放（户外遗址）",
    ticketPrice: "免费",
    transport: "地铁1号线文殊院站步行约10分钟",
    address: "四川省成都市青羊区正通顺街98号附近",
  },
  "双眼井": {
    openingHours: "全天开放（户外文物）",
    ticketPrice: "免费",
    transport: "地铁1号线文殊院站步行约10分钟",
    address: "四川省成都市青羊区正通顺街口",
  },
  "百花潭公园·慧园": {
    openingHours: "6:00-22:00",
    ticketPrice: "免费",
    transport: "地铁2号线通惠门站步行约10分钟",
    address: "四川省成都市青羊区芳邻路5号",
  },
};
