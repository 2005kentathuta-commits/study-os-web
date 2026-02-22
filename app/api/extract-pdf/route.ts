import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDFファイルが見つかりません" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = await pdf(Buffer.from(arrayBuffer));

    const text = data.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "PDFからテキストを抽出できませんでした" }, { status: 422 });
    }

    return NextResponse.json({
      text,
      pages: data.numpages,
      info: data.info ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "PDF処理に失敗しました" }, { status: 500 });
  }
}
