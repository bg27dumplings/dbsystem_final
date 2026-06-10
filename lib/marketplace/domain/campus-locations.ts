export type CampusBuilding = {
  group: string;
  name: string;
  x: number;
  y: number;
};

export const MINSHENG_BUILDINGS: CampusBuilding[] = [
  { group: "教學大樓", name: "求真樓", x: 30, y: 40 },
  { group: "教學大樓", name: "美術樓", x: 40, y: 35 },
  { group: "教學大樓", name: "忠義樓", x: 50, y: 35 },
  { group: "教學大樓", name: "樂群樓", x: 60, y: 35 },
  { group: "教學大樓", name: "音樂樓", x: 70, y: 40 },
  { group: "教學大樓", name: "科學樓", x: 80, y: 45 },
  { group: "教學大樓", name: "勤樸樓", x: 30, y: 60 },
  { group: "教學大樓", name: "教育樓", x: 40, y: 65 },
  { group: "教學大樓", name: "環境樓", x: 50, y: 65 },
  { group: "教學大樓", name: "數學樓", x: 60, y: 60 },
  { group: "熱門地標", name: "圖書館", x: 70, y: 55 },
  { group: "行政大樓", name: "行政樓", x: 80, y: 65 },
  { group: "熱門地標", name: "中正樓", x: 60, y: 80 },
  { group: "熱門地標", name: "大門", x: 85, y: 85 },
  { group: "熱門地標", name: "側門", x: 15, y: 85 },
  { group: "熱門地標", name: "操場", x: 80, y: 20 },
  { group: "熱門地標", name: "學生社團", x: 25, y: 80 },
  { group: "其他", name: "其他", x: 50, y: 50 }
];

export const OTHER_CAMPUS_LOCATIONS: { [key: string]: string[] } = {
  "英才校區": ["網球場", "汽機車停車場", "大門", "英才樓", "寶成演藝廳", "其他"],
  "宿舍": ["迎曦樓", "大詠絮樓", "小詠絮樓", "莊敬苑", "其他"],
  "其他": ["其他"]
};
