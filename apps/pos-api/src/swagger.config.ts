import { DocumentBuilder } from "@nestjs/swagger";

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle("POS")
    .setVersion("1.0")
    .addApiKey(
      { type: "apiKey", name: "x-pos-device-token", in: "header" },
      "PosDevice-auth",
    )
    .build();
}
