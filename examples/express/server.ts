import express from "express";
import { Tsara } from "@tsara/node";

const app = express();
const tsara = new Tsara({ secretKey: process.env.TSARA_SECRET_KEY! });

app.use(express.json());
app.post("/checkout", async (request, response, next) => {
  try {
    const checkout = await tsara.checkout.create(process.env.TSARA_PUBLIC_KEY!, request.body);
    response.json(checkout);
  } catch (error) {
    next(error);
  }
});

app.listen(3000);

