import { NextResponse } from "next/server";
import { sampleReservations } from "../../../lib/sample";

export const dynamic = "force-dynamic";

// Seoul Open Data documents the reservation API on HTTP port 8088.
// This request stays server-side; the key is never sent to the browser.
const SEOUL_API_BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE_NAME = "ListPublicReservationSport";
const PAGE_SIZE = 1000;

function parseDate(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(/\./g, "-");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function categoryFor(row) {
  const label = `${row.MAXCLASSNM || ""} ${row.MINCLASSNM || ""} ${row.SVCNM || ""}`;

  if (/체험|교육|강좌/.test(label)) return "experience";
  if (/어린이|유아|청소년/.test(label)) return "kids";
  if (/문화|공연|전시/.test(label)) return "culture";
  if (/대관|공간|회의/.test(label)) return "space";
  return "sport";
}

function isReceptionOpen(status) {
  return /접수\s*중/.test(String(status || ""));
}

function mapRow(row, i) {
  return {
    id: row.SVCID || `live-${i}`,
    category: categoryFor(row),
    name: row.SVCNM || row.MINCLASSNM || "체육시설 예약",
    place: row.PLACENM || "장소 확인",
    area: row.AREANM || "서울",
    free: String(row.PAYATNM || "").includes("무료"),
    status: row.SVCSTATNM || "상태 확인",
    receptionOpen: isReceptionOpen(row.SVCSTATNM),
    start: parseDate(row.SVCOPNBGNDT) || parseDate(row.RCPTBGNDT) || new Date().toISOString(),
    end: parseDate(row.SVCOPNENDDT) || parseDate(row.RCPTENDDT) || new Date(Date.now() + 30 * 86400000).toISOString(),
    receiptStart: parseDate(row.RCPTBGNDT),
    receiptEnd: parseDate(row.RCPTENDDT),
    target: row.USETGTINFO || "이용대상 확인",
    url: row.SVCURL || "https://yeyak.seoul.go.kr/",
    summary: `${row.MINCLASSNM || "체육시설"} · 공식 페이지에서 세부 예약시간 확인`
  };
}

export async function GET() {
  const key = process.env.SEOUL_OPEN_DATA_KEY?.trim();

  if (!key || key.includes("여기에_")) {
    return NextResponse.json({
      mode: "demo",
      source: "sample",
      count: sampleReservations.length,
      rows: sampleReservations
    });
  }

  try {
    const endpoint =
      `${SEOUL_API_BASE}/${encodeURIComponent(key)}/json/${SERVICE_NAME}/1/${PAGE_SIZE}/`;

    const res = await fetch(endpoint, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Seoul API HTTP ${res.status}`);
    }

    const json = await res.json();
    const block = json.ListPublicReservationSport;

    if (!block || !Array.isArray(block.row)) {
      const message =
        block?.RESULT?.MESSAGE ||
        json.RESULT?.MESSAGE ||
        "서울시 API 응답 형식을 확인해주세요.";
      throw new Error(message);
    }

    // The public dataset has no real-time remaining-seat field. Keep only fields
    // returned by Seoul's API and prioritize services whose reception is open.
    const rows = block.row
      .map(mapRow)
      .sort((a, b) => Number(b.receptionOpen) - Number(a.receptionOpen));

    return NextResponse.json({
      mode: "live",
      source: "Seoul Open Data",
      count: rows.length,
      rows
    }, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Failed to load Seoul public reservation data:", error);
    return NextResponse.json({
      mode: "fallback",
      source: "sample",
      error: error.message,
      count: sampleReservations.length,
      rows: sampleReservations
    });
  }
}
