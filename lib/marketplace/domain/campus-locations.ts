export type CampusBuilding = {
  group: string;
  name: string;
  x: number;
  y: number;
};

export const MINSHENG_BUILDINGS: CampusBuilding[] = [
  { group: "教學大樓", name: "求真樓", x: 26.5, y: 37.5 },
  { group: "教學大樓", name: "求真樓", x: 40, y: 35.5 },
  { group: "教學大樓", name: "求真樓", x: 41, y: 23.5 },
  { group: "教學大樓", name: "美術樓", x: 62, y: 22 },
  { group: "教學大樓", name: "美術樓", x: 63.5, y: 31 },
  { group: "教學大樓", name: "美術樓", x: 69.5, y: 28.5 },
  { group: "教學大樓", name: "美術樓", x: 70.5, y: 21 },
  { group: "教學大樓", name: "忠義樓", x: 52.5, y: 44 },
  { group: "教學大樓", name: "忠義樓", x: 60.5, y: 35 },
  { group: "教學大樓", name: "忠義樓", x: 56.5, y: 40 },
  { group: "教學大樓", name: "樂群樓", x: 48.5, y: 56 },
  { group: "教學大樓", name: "音樂樓", x: 61.5, y: 77 },
  { group: "教學大樓", name: "音樂樓", x: 56.5, y: 81.5 },
  { group: "教學大樓", name: "科學樓", x: 66, y: 62 },
  { group: "教學大樓", name: "科學樓", x: 62.5, y: 66.5 },
  { group: "教學大樓", name: "勤樸樓", x: 69, y: 58 },
  { group: "教學大樓", name: "教育樓", x: 75, y: 42 },
  { group: "教學大樓", name: "教育樓", x: 72, y: 46 },
  { group: "教學大樓", name: "教育樓", x: 74, y: 54 },
  { group: "教學大樓", name: "教育樓", x: 77.5, y: 48.5 },
  { group: "教學大樓", name: "環境樓", x: 87, y: 27 },
  { group: "教學大樓", name: "數學樓", x: 82.5, y: 46 },
  { group: "教學大樓", name: "數學樓", x: 86.5, y: 41.5 },
  { group: "熱門地標", name: "圖書館", x: 46.5, y: 30.5 },
  { group: "熱門地標", name: "圖書館", x: 49, y: 37 },
  { group: "熱門地標", name: "圖書館", x: 54, y: 32.5 },
  { group: "熱門地標", name: "圖書館", x: 51.5, y: 25.5 },
  { group: "行政大樓", name: "行政樓", x: 68.5, y: 78 },
  { group: "行政大樓", name: "行政樓", x: 72.5, y: 71.5 },
  { group: "行政大樓", name: "行政樓", x: 81.5, y: 59 },
  { group: "行政大樓", name: "行政樓", x: 77.5, y: 66 },
  { group: "教學大樓", name: "中正樓", x: 61, y: 44.5 },
  { group: "教學大樓", name: "中正樓", x: 55, y: 51.5 },
  { group: "教學大樓", name: "中正樓", x: 57, y: 60.5 },
  { group: "教學大樓", name: "中正樓", x: 63.5, y: 54.5 },
  { group: "熱門地標", name: "大門", x: 89.5, y: 84.5 },
  { group: "熱門地標", name: "側門", x: 52.5, y: 87.5 },
  { group: "熱門地標", name: "側門", x: 20, y: 81 },
  { group: "熱門地標", name: "側門", x: 20.5, y: 39 },
  { group: "熱門地標", name: "側門", x: 57, y: 22.5 },
  { group: "熱門地標", name: "操場", x: 36.5, y: 48 },
  { group: "熱門地標", name: "操場", x: 29, y: 48.5 },
  { group: "熱門地標", name: "操場", x: 28.5, y: 72.5 },
  { group: "熱門地標", name: "操場", x: 37, y: 72.5 },
  { group: "熱門地標", name: "操場", x: 37.5, y: 58 },
  { group: "熱門地標", name: "操場", x: 28, y: 61.5 },
  { group: "熱門地標", name: "學生社團", x: 22.5, y: 63 },
  { group: "熱門地標", name: "學生社團", x: 22.5, y: 73.5 },
  { group: "宿舍", name: "迎曦樓", x: 9, y: 42 },
  { group: "宿舍", name: "大詠絮樓", x: 9, y: 54 },
  { group: "宿舍", name: "小詠絮樓", x: 9, y: 64 },
  { group: "宿舍", name: "莊敬苑", x: 82, y: 29 },
  { group: "宿舍", name: "莊敬苑", x: 77.5, y: 35.5 },
  { group: "宿舍", name: "莊敬苑", x: 75.5, y: 30 }
];

export const OTHER_CAMPUS_LOCATIONS: { [key: string]: string[] } = {
  "英才校區": ["網球場", "汽機車停車場", "大門", "英才樓", "寶成演藝廳", "其他"],
  "其他": ["其他"]
};
