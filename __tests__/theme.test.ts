import { DesignTokens } from "@/constants/theme";

describe("DesignTokens typography", () => {
  it("provides named font weights for common text emphasis", () => {
    expect(DesignTokens.fontWeight).toEqual({
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extraBold: "800",
    });
  });

  it("provides shared control, avatar, and artwork dimensions", () => {
    expect(DesignTokens.sizing).toMatchObject({
      controlMinHeight: 48,
      commentFieldMinHeight: 80,
      avatar: 56,
      albumArtwork: 120,
    });
  });
});
