# 줍줍

서울 공공서비스예약 데이터를 이용해 "지금 예약 가능한 것"을 소비자 친화적으로 보여주는 MVP입니다.

## 실행

```bash
npm install
npm run dev
```

프로젝트 루트에 `.env.local` 파일을 만들고 서울 열린데이터광장에서 발급한 키를 넣으세요.

```env
SEOUL_OPEN_DATA_KEY=발급받은키
```

API 키가 없으면 샘플 데이터가 표시됩니다.

## 배포

Vercel에 GitHub 저장소를 연결한 뒤 Environment Variables에 아래 값을 추가하세요.

- `SEOUL_OPEN_DATA_KEY`

## 현재 범위

- 서울시 체육시설 공공서비스예약 API (`ListPublicReservationSport`)를 서버 Route에서 호출
- 접수중 우선 정렬 및 무료/오늘/내일/주말 필터
- 공식 예약페이지 이동
- API 키 미설정 시 demo fallback
- 공개 API가 제공하지 않는 실시간 잔여석은 표시하지 않음

## 다음 확장

1. 문화/교육/공간 등 전체 공공서비스 API 확장
2. 서비스 상태 이력 DB 저장
3. 마감 → 접수중 변화 감지
4. 사용자 관심등록/알림
5. 허용된 시간슬롯 데이터가 확보되면 실제 취소표 감지
