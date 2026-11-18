import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { ValueError } from "@open-dpp/exception";
import { JSDOM } from "jsdom";
import { sanitizeSvg, SVG_LIMITS } from "./svg-sanitizer";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

function svg(body: string, rootAttributes = ""): Buffer {
  return Buffer.from(
    `<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" viewBox="0 0 10 10"${rootAttributes}>${body}</svg>`,
  );
}

/** An SVG whose root and elements carry the prefix `s`, bound to the SVG namespace. */
function prefixedSvg(body: string, rootAttributes = ""): Buffer {
  return Buffer.from(
    `<s:svg xmlns:s="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" viewBox="0 0 10 10"${rootAttributes}>${body}</s:svg>`,
  );
}

/** The markup of the elements in the root, written with the given element prefix. */
type SvgBody = (elementPrefix: string) => string;

/** Each test runs on an SVG without prefixes and on one whose elements carry the prefix `s`. */
const SVG_SPELLINGS: [string, (body: SvgBody, rootAttributes?: string) => Buffer][] = [
  ["without prefixes", (body, rootAttributes) => svg(body(""), rootAttributes)],
  ["with prefixed elements", (body, rootAttributes) => prefixedSvg(body("s:"), rootAttributes)],
];

/** Binds the prefix `l` to the XLink namespace as well. */
const OTHER_XLINK_PREFIX = ` xmlns:l="${XLINK_NAMESPACE}"`;

/** The href of each use element in the output, without and with the XLink namespace. */
function useReferences(document: Document): (string | null)[][] {
  return Array.from(document.getElementsByTagNameNS("*", "use")).map((use) => [
    use.getAttributeNS(null, "href"),
    use.getAttributeNS(XLINK_NAMESPACE, "href"),
  ]);
}

function parseOutput(output: Buffer): Document {
  const { window } = new JSDOM("");
  return new window.DOMParser().parseFromString(output.toString("utf8"), "image/svg+xml");
}

function sanitizeAndParse(input: Buffer): { text: string; document: Document } {
  const output = sanitizeSvg(input);
  return { text: output.toString("utf8"), document: parseOutput(output) };
}

/** `levels` elements nested in the svg root, which is the first level itself. */
function nested(levels: number): Buffer {
  return svg("<g>".repeat(levels) + "</g>".repeat(levels));
}

function attributes(count: number): string {
  return Array.from({ length: count }, (_, index) => ` data-a${index}=""`).join("");
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

  describe("namespace prefixes", () => {
    it("keeps an SVG whose elements carry a prefix bound to the SVG namespace", () => {
      const { text, document } = sanitizeAndParse(
        prefixedSvg(
          `<s:defs><s:linearGradient id="g"><s:stop offset="0" stop-color="#000"/></s:linearGradient></s:defs>` +
            `<s:rect id="shape" width="10" height="10" fill="url(#g)"/><s:use xlink:href="#shape"/>`,
        ),
      );

      const root = document.documentElement;
      expect(document.getElementsByTagName("parsererror")).toHaveLength(0);
      expect(root.localName).toBe("svg");
      expect(root.namespaceURI).toBe(SVG_NAMESPACE);
      expect(root.getAttribute("viewBox")).toBe("0 0 10 10");
      expect(document.getElementsByTagNameNS(SVG_NAMESPACE, "linearGradient")).toHaveLength(1);
      expect(document.getElementsByTagNameNS(SVG_NAMESPACE, "rect")).toHaveLength(1);
      const use = document.getElementsByTagNameNS(SVG_NAMESPACE, "use")[0];
      expect(use?.getAttributeNS(XLINK_NAMESPACE, "href")).toBe("#shape");
      // Without a prefix, so a viewer that matches names instead of namespaces renders it too.
      expect(text).not.toMatch(/<s:|xmlns:s=/);
    });

    it("sanitizes a prefixed SVG to the same output as the SVG without prefixes", () => {
      const body = (p: string) =>
        `<${p}style><![CDATA[.a > .b { fill: red; }]]></${p}style><${p}script>alert(1)</${p}script>` +
        `<${p}rect id="r" class="a" width="1" height="1" onclick="alert(2)"/><${p}use xlink:href="#r"/>` +
        `<${p}set attributeName="onclick" to="alert(3)"/><${p}iframe src="javascript:alert(4)"/>` +
        `<${p}a href="javascript:alert(5)"><${p}text xml:space="preserve">a&#160;b</${p}text></${p}a>`;

      expect(sanitizeSvg(prefixedSvg(body("s:"))).toString("utf8")).toBe(
        sanitizeSvg(svg(body(""))).toString("utf8"),
      );
    });

    it("removes a prefixed script element", () => {
      const { text } = sanitizeAndParse(
        prefixedSvg(`<s:script>alert(1)</s:script><s:rect width="1" height="1"/>`),
      );

      expect(text).not.toMatch(/script|alert/);
      expect(text).toContain("<rect");
    });

    it("removes a prefixed foreignObject", () => {
      const { text } = sanitizeAndParse(
        prefixedSvg(
          `<s:foreignObject><div xmlns="${XHTML_NAMESPACE}"><img src="x" onerror="alert(1)"/></div></s:foreignObject>`,
        ),
      );

      expect(text).not.toMatch(/foreignObject|onerror|alert/);
    });

    it("removes event handler attributes from prefixed elements", () => {
      const { text } = sanitizeAndParse(
        prefixedSvg(
          `<s:rect width="1" height="1" onclick="alert(1)" s:onmouseover="alert(2)"/>`,
          ` onload="alert(3)"`,
        ),
      );

      expect(text).not.toMatch(/onclick|onmouseover|onload|alert/);
      expect(text).toContain("<rect");
    });

    it("removes elements whose prefix is bound to another namespace", () => {
      const { text, document } = sanitizeAndParse(
        prefixedSvg(
          `<h:script>alert(1)</h:script><h:img src="x" onerror="alert(2)"/><svg:script>alert(3)</svg:script><s:rect width="1" height="1"/>`,
          ` xmlns:h="${XHTML_NAMESPACE}" xmlns:svg="${XHTML_NAMESPACE}"`,
        ),
      );

      expect(document.getElementsByTagNameNS(XHTML_NAMESPACE, "*")).toHaveLength(0);
      expect(document.getElementsByTagNameNS("*", "script")).toHaveLength(0);
      expect(document.getElementsByTagNameNS(SVG_NAMESPACE, "rect")).toHaveLength(1);
      expect(text).not.toMatch(/<h:|<svg:|<img|onerror/);
    });

    it("removes a prefixed element named xmlns", () => {
      // Its name cannot be written without a prefix; it is no SVG element either.
      const { text } = sanitizeAndParse(prefixedSvg(`<s:xmlns/><s:rect width="1" height="1"/>`));

      expect(text).not.toContain("xmlns/");
      expect(text).toContain("<rect");
    });

    it("rejects a prefixed svg root outside the SVG namespace", () => {
      expect(() =>
        sanitizeSvg(Buffer.from(`<s:svg xmlns:s="${XHTML_NAMESPACE}"><s:rect/></s:svg>`)),
      ).toThrow(ValueError);
    });

    it("accepts prefixed elements nested as deep as the limit allows", () => {
      const levels = SVG_LIMITS.maxDepth - 1;
      const { document } = sanitizeAndParse(
        prefixedSvg("<s:g>".repeat(levels) + "</s:g>".repeat(levels)),
      );

      expect(document.getElementsByTagNameNS(SVG_NAMESPACE, "g")).toHaveLength(levels);
    });

    describe.each(SVG_SPELLINGS)(
      "XLink attributes with another prefix in an SVG %s",
      (_, build) => {
        it("keeps a use element whose reference has another XLink prefix", () => {
          const { text, document } = sanitizeAndParse(
            build(
              (p) => `<${p}rect id="shape" width="1" height="1"/><${p}use l:href="#shape"/>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          expect(useReferences(document)).toEqual([[null, "#shape"]]);
          // Under the prefix the root declares for XLink, so a viewer that matches names reads it too.
          expect(text).toContain(`<use xlink:href="#shape"/>`);
          expect(text).not.toMatch(/\bl:|xmlns:l=/);
        });

        it("sanitizes another XLink prefix to the same output as the prefix xlink", () => {
          const body = (xlink: string) => (p: string) =>
            `<${p}rect id="r" width="1" height="1"/><${p}use ${xlink}:href="#r"/>` +
            `<${p}use href="#r" ${xlink}:href="#r"/><${p}use href="#r" ${xlink}:href="https://evil.example/a.svg#r"/>` +
            `<${p}use ${xlink}:href="https://evil.example/sprite.svg#a"/>` +
            `<${p}a ${xlink}:href="javascript:alert(1)" ${xlink}:title="t" ${xlink}:show="new"><${p}text>a</${p}text></${p}a>`;

          expect(sanitizeSvg(build(body("l"), OTHER_XLINK_PREFIX)).toString("utf8")).toBe(
            sanitizeSvg(build(body("xlink"))).toString("utf8"),
          );
        });

        it("removes use elements that reference another document under another XLink prefix", () => {
          const { document } = sanitizeAndParse(
            build(
              (p) =>
                `<${p}use l:href="https://evil.example/sprite.svg#a"/>` +
                `<${p}use l:href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=#a"/>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          expect(useReferences(document)).toEqual([]);
        });

        it("removes javascript: links under another XLink prefix", () => {
          const { text } = sanitizeAndParse(
            build(
              (p) => `<${p}a l:href="javascript:alert(1)"><${p}rect width="1" height="1"/></${p}a>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          expect(text).not.toMatch(/javascript|alert/);
          expect(text).toContain("<rect");
        });

        it("keeps an unqualified href apart from a reference with another XLink prefix", () => {
          const { document } = sanitizeAndParse(
            build(
              (p) =>
                `<${p}rect id="a" width="1" height="1"/><${p}rect id="b" width="1" height="1"/>` +
                `<${p}use href="#a" l:href="#b"/><${p}use href="#a" l:href="https://evil.example/a.svg#b"/>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          // A viewer that knows href reads it before xlink:href; the second use is removed as with xlink.
          expect(useReferences(document)).toEqual([["#a", "#b"]]);
        });

        it("does not take an xlink:href in another namespace for a reference", () => {
          const { document } = sanitizeAndParse(
            build(
              (p) =>
                `<${p}rect id="a" width="1" height="1"/>` +
                `<${p}use xmlns:xlink="urn:example" xlink:href="https://evil.example/sprite.svg#a"/>` +
                `<${p}use href="#a" xmlns:xlink="urn:example" xlink:href="https://evil.example/sprite.svg#a"/>` +
                `<${p}use href="#a" xmlns:xlink="https://evil.example/ns" xlink:href="https://evil.example/sprite.svg#a"/>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          // A viewer ignores an href outside the XLink namespace, and the output keeps it outside.
          expect(useReferences(document)).toEqual([
            ["#a", null],
            ["#a", null],
          ]);
        });

        it("keeps a reference with another XLink prefix next to an xlink:href in another namespace", () => {
          const { document } = sanitizeAndParse(
            build(
              (p) =>
                `<${p}rect id="a" width="1" height="1"/>` +
                `<${p}use xmlns:xlink="urn:example" xlink:href="https://evil.example/sprite.svg#a" l:href="#a"/>` +
                `<${p}use xmlns:xlink="https://evil.example/ns" xlink:href="https://evil.example/sprite.svg#a" l:href="#a"/>`,
              OTHER_XLINK_PREFIX,
            ),
          );

          expect(useReferences(document)).toEqual([
            [null, "#a"],
            [null, "#a"],
          ]);
        });

        it("rejects an element with two XLink hrefs", () => {
          expect(() =>
            sanitizeSvg(build((p) => `<${p}use xlink:href="#a" l:href="#b"/>`, OTHER_XLINK_PREFIX)),
          ).toThrow(new ValueError("The file is not a well-formed SVG image."));
        });
      },
    );

    it.each([
      ["without prefixes", "", `xmlns="${SVG_NAMESPACE}"`],
      ["with prefixed elements", "s:", `xmlns:s="${SVG_NAMESPACE}"`],
    ])(
      "does not turn an xlink:href in another namespace into a reference when DOMPurify unwraps its parent, in an SVG %s",
      (_, p, declaration) => {
        // DOMPurify moves the content of the unknown element into the g, where xlink is the XLink
        // namespace, inside the root, where it is not.
        const { document } = sanitizeAndParse(
          Buffer.from(
            `<${p}svg ${declaration} xmlns:xlink="https://evil.example/ns"><${p}rect id="a" width="1" height="1"/>` +
              `<${p}g xmlns:xlink="${XLINK_NAMESPACE}"><${p}unknown xmlns:xlink="https://evil.example/ns">` +
              `<${p}use href="#a" xlink:href="https://evil.example/sprite.svg#a"/>` +
              `<${p}a xlink:href="https://evil.example/"><${p}rect width="1" height="1"/></${p}a>` +
              `</${p}unknown></${p}g></${p}svg>`,
          ),
        );

        expect(useReferences(document)).toEqual([["#a", null]]);
        const link = document.getElementsByTagNameNS(SVG_NAMESPACE, "a")[0];
        expect(link?.getAttributeNS(XLINK_NAMESPACE, "href")).toBeNull();
      },
    );
  });

  it("sanitizes the tree an XML parser builds, not one an HTML parser would", () => {
    // An HTML parser closes the svg at <p> and turns the following rect into an HTML element.
    const { document } = sanitizeAndParse(svg(`<p/><rect width="1" height="1"/>`));

    expect(document.getElementsByTagName("p")).toHaveLength(0);
    expect(document.getElementsByTagName("rect")).toHaveLength(1);
  });

  describe("limits", () => {
    it("accepts as many nodes as the limit allows", () => {
      // The svg root is a node as well.
      const { document } = sanitizeAndParse(svg("<g/>".repeat(SVG_LIMITS.maxNodes - 1)));

      expect(document.getElementsByTagName("g")).toHaveLength(SVG_LIMITS.maxNodes - 1);
    });

    it("rejects more elements than the node limit", () => {
      expect(() => sanitizeSvg(svg("<g/>".repeat(SVG_LIMITS.maxNodes)))).toThrow(ValueError);
    });

    it("counts comments towards the node limit", () => {
      expect(() => sanitizeSvg(svg("<!---->".repeat(SVG_LIMITS.maxNodes)))).toThrow(ValueError);
    });

    it("does not count markup inside a CDATA section or a comment as elements", () => {
      const markup = "<g/>".repeat(SVG_LIMITS.maxNodes);

      expect(() =>
        sanitizeSvg(svg(`<style><![CDATA[${markup}]]></style><!--${markup}-->`)),
      ).not.toThrow();
    });

    it("accepts elements nested as deep as the limit allows", () => {
      const { document } = sanitizeAndParse(nested(SVG_LIMITS.maxDepth - 1));

      expect(document.getElementsByTagName("g")).toHaveLength(SVG_LIMITS.maxDepth - 1);
    });

    it("rejects elements nested deeper than the limit", () => {
      expect(() => sanitizeSvg(nested(SVG_LIMITS.maxDepth))).toThrow(ValueError);
    });

    it("accepts an element with as many attributes as the limit allows", () => {
      expect(() =>
        sanitizeSvg(svg(`<g${attributes(SVG_LIMITS.maxAttributesPerElement)}/>`)),
      ).not.toThrow();
    });

    it("rejects an element with more attributes than the limit", () => {
      expect(() =>
        sanitizeSvg(svg(`<g${attributes(SVG_LIMITS.maxAttributesPerElement + 1)}/>`)),
      ).toThrow(ValueError);
    });

    it("rejects an element over the attribute limit before the rest of its start tag is read", () => {
      // The start tag never ends: the limit has to stop the parser before it notices.
      const input = svg(`<g${attributes(SVG_LIMITS.maxAttributesPerElement + 1)}`);

      expect(() => sanitizeSvg(input)).toThrow(
        `more than ${SVG_LIMITS.maxAttributesPerElement} attributes`,
      );
    });

    it("accepts a namespace declaration as long as the limit allows", () => {
      const uri = "u".repeat(SVG_LIMITS.maxNamespaceLength);

      expect(() =>
        sanitizeSvg(svg(`<g xmlns:p="${uri}" p:a="1"/>`, ` xmlns:q="${uri}"`)),
      ).not.toThrow();
    });

    it("rejects a namespace declaration longer than the limit", () => {
      const uri = "u".repeat(SVG_LIMITS.maxNamespaceLength + 1);

      expect(() => sanitizeSvg(svg("", ` xmlns:p="${uri}"`))).toThrow(ValueError);
      expect(() => sanitizeSvg(svg(`<g xmlns="${uri}"/>`))).toThrow(ValueError);
    });
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
