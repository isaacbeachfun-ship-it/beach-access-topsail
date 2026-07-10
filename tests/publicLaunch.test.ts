import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import vercelJson from "../vercel.json?raw";

const parseHtml = () => new DOMParser().parseFromString(indexHtml, "text/html");
const vercelConfig = JSON.parse(vercelJson) as {
  buildCommand?: string;
  framework?: string;
  outputDirectory?: string;
};

describe("public launch metadata", () => {
  it("publishes the canonical Topsail Beach Access identity", () => {
    const document = parseHtml();

    expect(document.title).toMatch(/^Topsail Beach Access/);
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe("https://topsailpricing.com/");
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.content,
    ).toBe("https://topsailpricing.com/");
    expect(
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.getAttribute("href"),
    ).toBe("/favicon.svg");
    expect(indexHtml).not.toMatch(/Treasure|prototype/i);
  });

  it("uses the Vite production build contract", () => {
    expect(vercelConfig).toMatchObject({
      buildCommand: "npm run build",
      framework: "vite",
      outputDirectory: "dist",
    });
  });
});
