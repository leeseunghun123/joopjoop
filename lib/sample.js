export const sampleReservations = [
  {
    id: "sample-1",
    category: "experience",
    name: "성수 생활공방 원데이클래스",
    place: "성동 생활문화센터",
    area: "성동구",
    free: true,
    status: "접수중",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 6 * 86400000).toISOString(),
    target: "성인",
    url: "https://yeyak.seoul.go.kr/",
    summary: "퇴근 후 가볍게 하기 좋은 무료 체험"
  },
  {
    id: "sample-2",
    category: "sport",
    name: "한강 풋살장 대관",
    place: "한강공원 체육시설",
    area: "영등포구",
    free: false,
    status: "접수중",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 15 * 86400000).toISOString(),
    target: "누구나",
    url: "https://yeyak.seoul.go.kr/",
    summary: "오늘 이용범위에 포함된 운동시설"
  },
  {
    id: "sample-3",
    category: "kids",
    name: "어린이 과학 체험교실",
    place: "서울 과학체험시설",
    area: "노원구",
    free: true,
    status: "접수중",
    start: new Date(Date.now() + 86400000).toISOString(),
    end: new Date(Date.now() + 10 * 86400000).toISOString(),
    target: "초등 동반가족",
    url: "https://yeyak.seoul.go.kr/",
    summary: "아이랑 가기 좋은 가족 프로그램"
  }
];
