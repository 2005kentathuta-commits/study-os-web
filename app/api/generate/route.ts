import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai";

const inputSchema = z.object({
  sourceText: z.string().min(200),
  sourceType: z.enum(["pdf", "notion", "manual"]),
  sourceTitle: z.string().min(1),
  cardTarget: z.number().int().min(10).max(120).default(40),
});

const outputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()).min(5).max(12),
  cards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).min(10),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "入力エラー" }, { status: 400 });
    }

    const { sourceText, sourceType, sourceTitle, cardTarget } = parsed.data;
    const client = getOpenAIClient();

    const prompt = [
      "あなたは医学・理系科目に強い日本語学習アシスタントです。",
      "与えられた学習資料を整理し、暗記カードを大量生成してください。",
      "カードは丸暗記だけでなく、比較・因果・手順・穴埋めを混ぜてください。",
      `カード枚数は${cardTarget}枚を目標にし、最低でも${Math.max(10, Math.floor(cardTarget * 0.8))}枚出してください。`,
      "JSONのみを返してください。",
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `ソース種別: ${sourceType}\nソースタイトル: ${sourceTitle}\n\n本文:\n${sourceText.slice(0, 120000)}`,
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "AI応答が空です" }, { status: 502 });
    }

    const json = JSON.parse(raw);
    const output = outputSchema.parse(json);
    return NextResponse.json(output);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "要約とカード生成に失敗しました" }, { status: 500 });
  }
}
