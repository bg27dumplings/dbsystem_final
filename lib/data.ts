export type ItemStatus = "active" | "reserved" | "removed" | "violation_removed" | "deleted";
export type AppointmentStatus = "pending" | "accepted" | "completed" | "failed" | "cancelled" | "rejected";

export type CampusItem = {
  id: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  seller: string;
  status: ItemStatus;
  originalPrice: number;
  salePrice?: number;
  exchangeNote: string;
  description: string;
  images: string[];
};

export const categories = ["全部", "課本/文具", "電子 3C", "生活雜物", "服飾配件", "宿舍用品"];

export const items: CampusItem[] = [
  {
    id: "textbook-db",
    title: "資料庫系統概論課本",
    category: "課本/文具",
    condition: "八成新",
    location: "圖書館一樓",
    seller: "資管三 A 林同學",
    status: "active",
    originalPrice: 520,
    salePrice: 350,
    exchangeNote: "350 元或一杯大冰美",
    description: "上學期資料庫課使用，內頁少量螢光筆，附老師補充講義夾。適合期末複習與專題查詢語法。",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "keyboard",
    title: "無線鍵盤滑鼠組",
    category: "電子 3C",
    condition: "九成新",
    location: "工學院穿堂",
    seller: "電機二 B 陳同學",
    status: "reserved",
    originalPrice: 900,
    salePrice: 620,
    exchangeNote: "620 元，可小議",
    description: "宿舍桌面整理後出售，藍牙與 2.4G 都可使用，適合平板或筆電。",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80"]
  },
  {
    id: "lamp",
    title: "宿舍閱讀檯燈",
    category: "宿舍用品",
    condition: "七成新",
    location: "女宿門口",
    seller: "外文四 C 王同學",
    status: "active",
    originalPrice: 450,
    exchangeNote: "free，請自取",
    description: "三段亮度，USB 供電，搬宿舍用不到。外觀有一點磨痕但功能正常。",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"]
  },
  {
    id: "calculator",
    title: "工程計算機",
    category: "課本/文具",
    condition: "八成新",
    location: "商學院咖啡廳",
    seller: "會計二 A 張同學",
    status: "active",
    originalPrice: 780,
    salePrice: 500,
    exchangeNote: "500 元",
    description: "統計課與會計課可用，按鍵正常，含保護蓋。",
    images: ["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=900&q=80"]
  }
];

export const appointments = [
  {
    id: "apt-001",
    itemTitle: "無線鍵盤滑鼠組",
    buyer: "資工一 A 黃同學",
    seller: "電機二 B 陳同學",
    time: "2026-06-08 18:30",
    location: "工學院穿堂",
    amount: 600,
    status: "accepted" as AppointmentStatus
  }
];
