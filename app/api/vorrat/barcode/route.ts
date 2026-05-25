import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const barcode = new URL(request.url).searchParams.get("code");
  if (!barcode) return NextResponse.json({ error: "Kein Barcode angegeben" }, { status: 400 });

  try {
    await connectDB();
    const { default: Product } = await import("@/models/Product");
    const product = await Product.findOne({ barcode }).populate("categoryId", "name color").lean();
    if (product) return NextResponse.json({ found: true, product });

    // Externe Abfrage bei Open Food Facts
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          return NextResponse.json({
            found: false,
            suggestion: {
              name: p.product_name_de || p.product_name || "",
              barcode,
              image: p.image_front_url || p.image_url || p.image_small_url || null,
            },
          });
        }
      }
    } catch {
      // externe Abfrage optional, Fehler ignorieren
    }

    return NextResponse.json({ found: false, suggestion: { name: "", barcode } });
  } catch (e) {
    console.error("GET /api/vorrat/barcode:", e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
