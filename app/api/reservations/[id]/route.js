import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEOUL_API_BASE = "http://openapi.seoul.go.kr:8088";

function cleanText(value, limit = 900) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function hours(row) {
  const start = cleanText(row.V_MIN, 20);
  const end = cleanText(row.V_MAX, 20);
  return start && end ? `${start} ~ ${end}` : start || end || "공식 페이지에서 확인";
}

export async function GET(_request, { params }) {
  const key = process.env.SEOUL_OPEN_DATA_KEY?.trim();
  const { id } = await params;

  if (!key || key.includes("여기에_")) {
    return NextResponse.json({ error: "서울시 API 키가 설정되지 않았습니다." }, { status: 503 });
  }

  try {
    const endpoint = `${SEOUL_API_BASE}/${encodeURIComponent(key)}/json/ListPublicReservationDetail/1/5/${encodeURIComponent(id)}/`;
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) throw new Error(`Seoul API HTTP ${response.status}`);

    const data = await response.json();
    const block = data.ListPublicReservationDetail;
    const row = block?.row?.[0];
    if (!row) throw new Error(block?.RESULT?.MESSAGE || "상세 예약 정보를 찾을 수 없습니다.");

    return NextResponse.json({
      id,
      selection: cleanText(row.SELMTHDCODE_NM, 100) || "공식 페이지에서 확인",
      method: cleanText(row.RCEPTMTH_NM, 100) || "공식 페이지에서 확인",
      people: `${cleanText(row.ONEREQMINPR, 20) || "1"} ~ ${cleanText(row.ONEREQMXMPR, 20) || "확인"}명`,
      hours: hours(row),
      cancellation: cleanText(row.REVSTDDAYNM, 100) || "공식 페이지에서 확인",
      phone: cleanText(row.TELNO, 100) || cleanText(row.SVCENDTELNO, 100),
      address: cleanText(row.ADRES, 200),
      notice: cleanText(row.NOTICE),
      description: cleanText(row.DTLCONT)
    }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error) {
    console.error("Failed to load Seoul reservation detail:", error);
    return NextResponse.json({ error: "공식 상세 예약 정보를 불러오지 못했습니다." }, { status: 502 });
  }
}
