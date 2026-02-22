"use client";

import { useMemo, useState } from "react";
import { dueCards, makeCard, nextByRating } from "@/lib/spaced-repetition";
import type { CardRating, GeneratedPackage, StudyCard } from "@/types/study";

type SourceType = "pdf" | "notion" | "manual";

const storageKey = "study_os_cards_v1";

function loadLocalCards(): StudyCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalCards(cards: StudyCard[]) {
  localStorage.setItem(storageKey, JSON.stringify(cards));
}

export default function StudyDashboard() {
  const [sourceType, setSourceType] = useState<SourceType>("pdf");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [cardTarget, setCardTarget] = useState(40);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pack, setPack] = useState<GeneratedPackage | null>(null);
  const [cards, setCards] = useState<StudyCard[]>(() => loadLocalCards());
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const due = useMemo(() => dueCards(cards), [cards]);
  const current = due[index];

  async function onUploadPdf(file: File) {
    setMessage("PDFを解析中...");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "PDF処理に失敗しました");
      return;
    }
    setSourceType("pdf");
    setSourceTitle(file.name);
    setSourceText(json.text);
    setMessage(`PDF解析完了: ${json.pages}ページ`);
  }

  async function onGenerate() {
    if (sourceText.trim().length < 200) {
      setMessage("本文が短すぎます。PDFかNotion本文を入れてください。");
      return;
    }

    setLoading(true);
    setMessage("要約とカードを生成中...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceTitle: sourceTitle.trim() || "無題ソース",
          sourceText,
          cardTarget,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "生成に失敗しました");
        return;
      }

      const nextPack = json as GeneratedPackage;
      setPack(nextPack);

      const newCards = nextPack.cards.map((c) =>
        makeCard({
          question: c.question,
          answer: c.answer,
          sourceType,
          sourceTitle: sourceTitle.trim() || nextPack.title,
        })
      );

      const updated = [...cards, ...newCards];
      setCards(updated);
      saveLocalCards(updated);
      setMessage(`${newCards.length}枚のカードを追加しました`);
      setIndex(0);
      setShowAnswer(false);
    } catch {
      setMessage("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function rateCard(rating: CardRating) {
    if (!current) return;
    const updated = cards.map((c) => (c.id === current.id ? nextByRating(c, rating) : c));
    setCards(updated);
    saveLocalCards(updated);
    setShowAnswer(false);
    setIndex(0);
  }

  return (
    <main className="grid" style={{ gap: 24 }}>
      <section className="card" style={{ padding: 20 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Study OS (MVP)</h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
          PDFアップロード、Notion貼り付け、要約・大量カード生成、4段階復習を1つにまとめた学習サイト。
        </p>
      </section>

      <section className="grid grid-2">
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>1. 学習素材を入れる</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontWeight: 700 }}>PDFアップロード</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadPdf(file);
              }}
            />

            <label style={{ fontWeight: 700 }}>ソース種別</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
              <option value="pdf">PDF</option>
              <option value="notion">Notion貼り付け</option>
              <option value="manual">手入力</option>
            </select>

            <label style={{ fontWeight: 700 }}>タイトル</label>
            <input
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="例: 薬理学 第3章"
            />

            <label style={{ fontWeight: 700 }}>本文（Notionから貼り付け可）</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Notionのノート本文をここに貼り付け"
            />
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: "grid", alignContent: "start", gap: 14 }}>
          <h2 style={{ fontSize: 20 }}>2. 生成設定</h2>

          <label style={{ fontWeight: 700 }}>カード目標枚数: {cardTarget}</label>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={cardTarget}
            onChange={(e) => setCardTarget(Number(e.target.value))}
          />

          <button
            style={{ background: "var(--primary)", color: "#fff", marginTop: 6 }}
            onClick={() => void onGenerate()}
            disabled={loading}
          >
            {loading ? "生成中..." : "要約＋カード生成"}
          </button>

          <p style={{ margin: 0, color: "var(--muted)", minHeight: 24 }}>{message}</p>

          {pack && (
            <div
              style={{
                background: "var(--primary-weak)",
                border: "1px solid #cce4df",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <strong>{pack.title}</strong>
              <p style={{ margin: 0, lineHeight: 1.65 }}>{pack.summary}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>3. 今日の復習</h2>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            期限カード: {due.length}枚 / 総カード: {cards.length}枚
          </p>

          {!current ? (
            <div style={{ color: "var(--muted)" }}>今日の復習は完了です。</div>
          ) : (
            <div className="card" style={{ padding: 16, borderStyle: "dashed" }}>
              <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13 }}>
                {current.sourceTitle}
              </p>
              <h3 style={{ lineHeight: 1.6, marginBottom: 14 }}>{current.question}</h3>

              {showAnswer && (
                <div
                  style={{
                    background: "#f3faf8",
                    border: "1px solid #d5ece6",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                    lineHeight: 1.7,
                  }}
                >
                  {current.answer}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!showAnswer ? (
                  <button
                    style={{ background: "var(--accent)", color: "#fff" }}
                    onClick={() => setShowAnswer(true)}
                  >
                    答えを見る
                  </button>
                ) : (
                  <>
                    <button style={{ background: "#ffe8e8", color: "var(--danger)" }} onClick={() => rateCard("again")}>もう一度</button>
                    <button style={{ background: "#fff0d8", color: "#a35c00" }} onClick={() => rateCard("hard")}>難しい</button>
                    <button style={{ background: "#e7f3ff", color: "#145ea8" }} onClick={() => rateCard("good")}>普通</button>
                    <button style={{ background: "#dbf6e8", color: "#0d7a45" }} onClick={() => rateCard("easy")}>簡単</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>4. 次の拡張（実装済み準備）</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: "var(--muted)" }}>
            <li>Notion OAuth同期（今は貼り付け運用）</li>
            <li>カード種類ごとの生成比率指定（穴埋め/比較/因果）</li>
            <li>カード重複検出と統合</li>
            <li>教科・試験日ごとの復習負荷バランス</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
