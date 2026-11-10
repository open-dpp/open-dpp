import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { ValueError } from "@open-dpp/exception";
import { JSDOM } from "jsdom";
import { sanitizeSvg } from "./svg-sanitizer";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function svg(body: string, rootAttributes = ""): Buffer {
  return Buffer.from(
    `<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" viewBox="0 0 10 10"${rootAttributes}>${body}</svg>`,
  );
}

function parseOutput(output: Buffer): Document {
  const { window } = new JSDOM("");
  return new window.DOMParser().parseFromString(output.toString("utf8"), "image/svg+xml");
}

function sanitizeAndParse(input: Buffer): { text: string; document: Document } {
  const output = sanitizeSvg(input);
  return { text: output.toString("utf8"), document: parseOutput(output) };
}

describe("sanitizeSvg", () => {
  it("keeps a well-formed SVG with styles, gradients and internal references", () => {
    const { document } = sanitizeAndParse(
      svg(
        `<defs><style>.a{fill:#f00}</style><linearGradient id="g" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000"/></linearGradient></defs>` +
          `<rect id="shape" class="a" width="10" height="10" fill="url(#g)"/>` +
          `<use href="#shape"/><use xlink:href="#shape"/>`,
      ),
    );

    const root = document.documentElement;
    expect(document.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(root.localName).toBe("svg");
    expect(root.namespaceURI).toBe(SVG_NAMESPACE);
    expect(root.getAttribute("viewBox")).toBe("0 0 10 10");
    expect(document.getElementsByTagName("style")[0]?.textContent).toContain(".a{fill:#f00}");
    expect(document.getElementsByTagName("linearGradient")).toHaveLength(1);
    const uses = Array.from(document.getElementsByTagName("use"));
    expect(
      uses.map((use) => use.getAttribute("href") ?? use.getAttributeNS(XLINK_NAMESPACE, "href")),
    ).toEqual(["#shape", "#shape"]);
  });

  it("accepts an SVG with an XML declaration and a leading editor comment", () => {
    const input = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator: Adobe Illustrator 28.0.0 -->\n${svg('<rect width="1" height="1"/>').toString()}`,
    );

    const { document } = sanitizeAndParse(input);

    expect(document.documentElement.localName).toBe("svg");
    expect(document.getElementsByTagName("rect")).toHaveLength(1);
  });

  it("removes script elements", () => {
    const { text } = sanitizeAndParse(svg(`<script>alert(1)</script><rect width="1" height="1"/>`));

    expect(text).not.toContain("script");
    expect(text).not.toContain("alert");
  });

  it("removes event handler attributes", () => {
    const { text } = sanitizeAndParse(
      svg(`<rect width="1" height="1" onclick="alert(1)"/>`, ` onload="alert(2)"`),
    );

    expect(text).not.toMatch(/onclick|onload|alert/);
  });

  it("removes foreignObject content", () => {
    const { text } = sanitizeAndParse(
      svg(
        `<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></foreignObject>`,
      ),
    );

    expect(text).not.toMatch(/foreignObject|onerror|alert/);
  });

  it("removes javascript: links", () => {
    const { text } = sanitizeAndParse(
      svg(
        `<a href="javascript:alert(1)"><rect width="1" height="1"/></a><a xlink:href="javascript:alert(2)"><rect width="1" height="1"/></a>`,
      ),
    );

    expect(text).not.toMatch(/javascript|alert/);
  });

  it("removes animation elements that could set script attributes", () => {
    const { text } = sanitizeAndParse(
      svg(
        `<set attributeName="onmouseover" to="alert(1)"/><animate attributeName="href" values="javascript:alert(2)"/>`,
      ),
    );

    expect(text).not.toMatch(/<set|<animate|alert/);
  });

  it("removes use elements that reference another document", () => {
    const { document } = sanitizeAndParse(
      svg(
        `<use href="https://evil.example/sprite.svg#a"/>` +
          `<use xlink:href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=#a"/>` +
          `<use/>`,
      ),
    );

    expect(document.getElementsByTagName("use")).toHaveLength(0);
  });

  it("removes editor-specific markup", () => {
    const { text } = sanitizeAndParse(
      svg(
        `<sodipodi:namedview id="base"/><rect width="1" height="1" inkscape:label="Layer 1"/>`,
        ` xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"`,
      ),
    );

    expect(text).not.toMatch(/sodipodi|inkscape/);
    expect(text).toContain("<rect");
  });

  it("keeps CDATA style sheets readable", () => {
    const { document } = sanitizeAndParse(
      svg(
        `<style><![CDATA[.a > .b { fill: red; }]]></style><rect class="b" width="1" height="1"/>`,
      ),
    );

    expect(document.getElementsByTagName("style")[0]?.textContent).toContain(
      ".a > .b { fill: red; }",
    );
  });

  it("keeps non-breaking spaces as well-formed XML", () => {
    const { document } = sanitizeAndParse(svg(`<text>a&#160;b</text>`));

    expect(document.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(document.getElementsByTagName("text")[0]?.textContent).toBe("a b");
  });

  it("rejects a DOCTYPE declaration", () => {
    const input = Buffer.from(
      `<!doctype svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">${svg("").toString()}`,
    );

    expect(() => sanitizeSvg(input)).toThrow(ValueError);
  });

  it("rejects an ENTITY declaration", () => {
    const input = Buffer.from(
      `<!DOCTYPE svg [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;">]>${svg("<text>&lol2;</text>").toString()}`,
    );

    expect(() => sanitizeSvg(input)).toThrow(ValueError);
  });

  it("rejects malformed XML", () => {
    expect(() => sanitizeSvg(svg("<rect>"))).toThrow(ValueError);
  });

  it("rejects an XML document whose root is not an SVG element", () => {
    const input = Buffer.from(
      `<html xmlns="http://www.w3.org/1999/xhtml"><svg xmlns="${SVG_NAMESPACE}"/></html>`,
    );

    expect(() => sanitizeSvg(input)).toThrow(ValueError);
  });

  it("rejects an svg root outside the SVG namespace", () => {
    expect(() => sanitizeSvg(Buffer.from(`<svg viewBox="0 0 1 1"><rect/></svg>`))).toThrow(
      ValueError,
    );
  });

  it("rejects a file that is not valid UTF-8", () => {
    const input = Buffer.concat([
      Buffer.from(`<svg xmlns="${SVG_NAMESPACE}"><text>`),
      Buffer.from([0xff, 0xfe, 0xfd]),
      Buffer.from(`</text></svg>`),
    ]);

    expect(() => sanitizeSvg(input)).toThrow(ValueError);
  });
});
