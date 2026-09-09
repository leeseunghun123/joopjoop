"use client";

import { useEffect, useMemo, useState } from "react";

function startOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOf(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(n) {
  const x = new Date();
  x.setDate(x.getDate() + n);
  return x;
}

function includesDate(item, d) {
  return startOf(new Date(item.start)) <= endOf(d) &&
    endOf(new Date(item.end)) >= startOf(d);
}

function weekendDates() {
  const today = new Date();
  const diff = (6 - today.getDay() + 7) % 7;
  return [addDays(diff), addDays(diff + 1)];
}

function inWeekend(item) {
  return weekendDates().some((d) => includesDate(item, d));
}

function isOpen(item) {
  return item.receptionOpen === true || /접수\s*중/.test(String(item.status || ""));
}

function fmt(v) {
  const d = new Date(v);
  const currentYear = new Date().getFullYear();
  const year = d.getFullYear() === currentYear ? "" : `${d.getFullYear()}년 `;
  return `${year}${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function bookingMessage(item) {
  if (isOpen(item) && item.receiptEnd) return `지금 신청 가능 · ${fmt(item.receiptEnd)} 마감`;
  if (item.receiptStart && new Date(item.receiptStart) > new Date()) return `${fmt(item.receiptStart)}부터 신청`;
  return isOpen(item) ? "지금 신청 가능" : "신청 가능 여부 확인 필요";
}

function icon(cat) {
  return {
    sport: "🏃",
    experience: "🎨",
    kids: "👶",
    culture: "🎭",
    space: "🏢"
  }[cat] || "📌";
}

export default function Home() {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("loading");
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState("all");
  const [time, setTime] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");
  const [area, setArea] = useState("all");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    try {
      setFavoriteIds(JSON.parse(window.localStorage.getItem("joopjoop-favorites") || "[]"));
    } catch {
      window.localStorage.removeItem("joopjoop-favorites");
    }
  }, []);

  const areas = useMemo(
    () => [...new Set(rows.map((row) => row.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows
      .filter((x) => {
        const hay = `${x.name} ${x.place} ${x.area} ${x.target} ${x.summary} ${x.free ? "무료" : ""}`.toLowerCase();

        if (q && !hay.includes(q)) return false;
        if (area !== "all" && x.area !== area) return false;
        if (showFavoritesOnly && !favoriteIds.includes(x.id)) return false;
        if (intent === "free" && !x.free) return false;
        if (intent === "sport" && x.category !== "sport") return false;
        if (intent === "weekend" && !inWeekend(x)) return false;

        if (time === "today" && !includesDate(x, addDays(0))) return false;
        if (time === "tomorrow" && !includesDate(x, addDays(1))) return false;
        if (time === "weekend" && !inWeekend(x)) return false;
        if (time === "open" && !isOpen(x)) return false;
        if (time === "free" && !x.free) return false;

        return true;
      })
      .sort((a, b) => {
        const aScore = (isOpen(a) ? 50 : 0) + (a.free ? 20 : 0) + (includesDate(a, addDays(0)) ? 10 : 0);
        const bScore = (isOpen(b) ? 50 : 0) + (b.free ? 20 : 0) + (includesDate(b, addDays(0)) ? 10 : 0);
        return bScore - aScore;
      });
  }, [rows, query, area, favoriteIds, showFavoritesOnly, intent, time]);

  useEffect(() => {
    fetch("/api/reservations")
      .then(async (r) => {
        if (!r.ok) throw new Error("예약 데이터를 불러오지 못했습니다.");
        return r.json();
      })
      .then((json) => {
        setRows(json.rows || []);
        setMode(json.mode || "demo");
        if (json.error) setLoadError("실시간 데이터를 불러오지 못해 예시 데이터를 표시합니다.");
      })
      .catch(() => {
        setMode("error");
        setLoadError("예약 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    open: filtered.filter(isOpen).length,
    free: filtered.filter((x) => x.free).length,
    total: filtered.length
  };

  function selectQuickFilter(value) {
    const filters = {
      all: { intent: "all", time: "open" },
      free: { intent: "free", time: "all" },
      sport: { intent: "sport", time: "all" },
      weekend: { intent: "all", time: "weekend" }
    };

    setQuickFilter(value);
    setIntent(filters[value].intent);
    setTime(filters[value].time);
  }

  function selectDetailFilter(value) {
    setQuickFilter("custom");
    setIntent("all");
    setTime(value);
  }

  function toggleFavorite(id) {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("joopjoop-favorites", JSON.stringify(next));
      return next;
    });
  }

  function resetFilters() {
    setQuery("");
    setIntent("all");
    setTime("open");
    setQuickFilter("all");
    setArea("all");
    setShowFavoritesOnly(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">줍줍</div>
        <div className={`mode ${mode === "live" ? "live" : ""}`}>
          <span className="dot" />
          {mode === "live" ? "SEOUL LIVE" : mode === "loading" ? "LOADING" : "DEMO"}
        </div>
      </header>

      <section className="hero">
        <h1>오늘 뭐 하지?<br />열린 자리만 줍자.</h1>
        <p>무료 · 운동 · 주말처럼 하고 싶은 것부터 고르세요.</p>

        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 마포 무료, 풋살, 아이랑"
          />
        </div>

        <div className="chips">
          {[
            ["all", "🔥 지금 줍줍"],
            ["free", "💸 무료"],
            ["sport", "🏃 운동"],
            ["weekend", "🌤 이번 주말"]
          ].map(([value, label]) => (
            <button
              key={value}
              className={quickFilter === value ? "active" : ""}
              onClick={() => selectQuickFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="stats">
        <div><b>{stats.open}</b><span>접수중</span></div>
        <div><b>{stats.free}</b><span>무료</span></div>
        <div><b>{stats.total}</b><span>현재 결과</span></div>
      </section>

      <section className="filters">
        {[
          ["all", "전체"],
          ["today", "오늘 이용"],
          ["tomorrow", "내일 이용"],
          ["weekend", "주말"],
          ["open", "접수중"],
          ["free", "무료"]
        ].map(([value, label]) => (
          <button
              key={value}
              className={quickFilter === "custom" && time === value ? "active" : ""}
              onClick={() => selectDetailFilter(value)}
          >
            {label}
          </button>
        ))}
      </section>

      <div className="filterTools">
        <label className="areaSelect">
          <span>지역</span>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">서울 전체</option>
            {areas.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="filterActions">
          <button
            className={showFavoritesOnly ? "active" : ""}
            onClick={() => setShowFavoritesOnly((value) => !value)}
          >
            {showFavoritesOnly ? "♥ 찜만 보는 중" : `♡ 찜 ${favoriteIds.length}`}
          </button>
          <button className="reset" onClick={resetFilters}>초기화</button>
        </div>
      </div>
      <p className="filterHint">오늘·내일·주말은 공개 API의 서비스 이용기간 기준이며, 실시간 잔여석이나 시간대별 가능 여부는 아닙니다.</p>

      <section className="sectionHead">
        <h2>지금 주울 수 있는 것</h2>
        <span>{loading ? "불러오는 중" : `${filtered.length}개 · 찜 ${favoriteIds.length}`}</span>
      </section>

      {loadError && <p className="notice" role="status">{loadError}</p>}

      <section className="grid">
        {filtered.map((x) => (
          <article className="card" key={x.id}>
            <div className="badges">
              {x.free && <span className="badge free">무료</span>}
              <span className={`badge ${isOpen(x) ? "open" : ""}`}>{x.status}</span>
            </div>

            <h3>{icon(x.category)} {x.name}</h3>

            <div className="meta">
              📍 {x.area} · {x.place}<br />
              👤 {x.target}
            </div>

            <div className="bookingInfo">
              <div>
                <span>예약 신청</span>
                <b className={isOpen(x) ? "available" : ""}>{bookingMessage(x)}</b>
              </div>
              <div>
                <span>이용 가능</span>
                <b>{fmt(x.start)} ~ {fmt(x.end)}</b>
              </div>
            </div>

            <div className="note">{x.summary}</div>

            <div className="grow" />

            <div className="cardActions">
              <button
                className={`favorite ${favoriteIds.includes(x.id) ? "saved" : ""}`}
                onClick={() => toggleFavorite(x.id)}
                aria-pressed={favoriteIds.includes(x.id)}
              >
                {favoriteIds.includes(x.id) ? "♥ 찜됨" : "♡ 찜"}
              </button>
              <a href={x.url} target="_blank" rel="noreferrer" className="primary">공식예약 →</a>
            </div>
          </article>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty">조건에 맞는 줍줍이 없어요.</div>
        )}
      </section>

      <footer>
        서울 열린데이터광장 서비스 상태와 이용기간 기준입니다. 실제 예약 시간과 잔여석은 공식예약 페이지에서 확인하세요.
      </footer>
    </main>
  );
}
