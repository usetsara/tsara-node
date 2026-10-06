import { Tsara } from "@tsara/node";

const tsara = new Tsara({ secretKey: process.env.TSARA_SECRET_KEY! });

export async function POST(request: Request) {
  const payload = await request.json();
  const checkout = await tsara.checkout.create(process.env.TSARA_PUBLIC_KEY!, payload);
  return Response.json(checkout);
}

