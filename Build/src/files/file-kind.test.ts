import { describe, expect, it } from "vitest";
import { classifyFile } from "./file-kind";

describe("classifyFile", () => {
  it("classifies readable text as text", async () => {
    const result = await classifyFile(
      new File(["hello, Nitoshu"], "notes.txt", { type: "text/plain" }),
    );
    expect(result.kind).toBe("text");
  });

  it("classifies PDFs as previews", async () => {
    const result = await classifyFile(
      new File(["not inspected for extension fallback"], "notes.pdf"),
    );
    expect(result.kind).toBe("pdf");
  });

  it("classifies null-containing content as binary", async () => {
    const result = await classifyFile(
      new File([new Uint8Array([0, 1, 2])], "data.bin"),
    );
    expect(result.kind).toBe("binary");
  });
});
