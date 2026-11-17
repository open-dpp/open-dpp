import type { DOMWindow } from "jsdom";
import { Buffer } from "node:buffer";
import { ValueError } from "@open-dpp/exception";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { SaxesParser } from "saxes";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>\n';
// Checked on the raw text before any parser runs: jsdom's XML parser expands internal entities.
const DOCUMENT_TYPE_DECLARATION = /<!(?:DOCTYPE|ENTITY)/i;
// The options jsdom's XML parser runs saxes with, so the scan sees the markup jsdom builds from.
const JSDOM_SAXES_OPTIONS = {
  xmlns: true,
  defaultXMLVersion: "1.0",
  forceXMLVersion: true,
} as const;

/**
 * Parsing, sanitizing and serializing run synchronously on the request thread. jsdom and saxes
 * slow down quadratically with nesting depth and with the attributes of one element, every
 * attribute costs jsdom a few kilobytes, jsdom parses a `style` attribute as CSS each time it is
 * set, and saxes copies a namespace URI once for every attribute with its prefix.
 */
export const SVG_LIMITS = {
  /** Elements, comments, CDATA sections and processing instructions; text sits between them. */
  maxNodes: 10_000,
  /** The svg root is the first level. */
  maxDepth: 128,
  maxAttributesPerElement: 100,
  maxAttributes: 50_000,
  /** Characters in all `style` attributes together. */
  maxStyleLength: 1_000_000,
  /** Characters in one namespace URI; editors declare URIs of up to about 50. */
  maxNamespaceLength: 256,
} as const;

type Purifier = ReturnType<typeof createDOMPurify>;

interface SvgToolkit {
  readonly window: DOMWindow;
  readonly purifier: Purifier;
}

let toolkit: SvgToolkit | undefined;

/** One jsdom window and DOMPurify instance per process, created on the first SVG upload. */
function getToolkit(): SvgToolkit {
  if (!toolkit) {
    const { window } = new JSDOM("");
    const purifier = createDOMPurify(window as unknown as Window & typeof globalThis);
    purifier.addHook("afterSanitizeAttributes", removeUseOfOtherDocuments);
    toolkit = { window, purifier };
  }
  return toolkit;
}

/**
 * DOMPurify drops every `<use>`; it is allowed back in for `#id` references inside the same SVG.
 * A reference to another document (a URL or a data: URI) can pull in unsanitized markup.
 */
function removeUseOfOtherDocuments(node: Element): void {
  if (node.localName !== "use") {
    return;
  }
  const references = [
    node.getAttribute("href"),
    node.getAttributeNS(XLINK_NAMESPACE, "href"),
  ].filter((reference): reference is string => reference !== null);
  if (references.length === 0 || references.some((reference) => !reference.startsWith("#"))) {
    node.remove();
  }
}

function decodeUtf8(input: Buffer): string {
  try {
    // A leading byte order mark is dropped by the decoder.
    return new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch (error) {
    throw new ValueError("SVG files must be UTF-8 encoded.", { cause: error });
  }
}

/** Adds to a running count, which may also go down, and throws once it is above `max`. */
function limitedCount(max: number, message: string): (amount?: number) => void {
  let count = 0;
  return (amount = 1) => {
    count += amount;
    if (count > max) {
      throw new ValueError(message);
    }
  };
}

function limitedAttributesOfElement(): (amount?: number) => void {
  return limitedCount(
    SVG_LIMITS.maxAttributesPerElement,
    `An element of the SVG image has more than ${SVG_LIMITS.maxAttributesPerElement} attributes.`,
  );
}

/**
 * Streams the text through saxes, which builds no DOM, and stops at the first limit exceeded,
 * before saxes reads any further. Counts what the parser reports, so markup inside a comment or a
 * CDATA section is text, and an element is counted however its name is spelled.
 */
function assertWithinLimits(text: string): void {
  const { maxNodes, maxDepth, maxAttributes, maxStyleLength, maxNamespaceLength } = SVG_LIMITS;
  const countNode = limitedCount(maxNodes, `The SVG image has more than ${maxNodes} elements.`);
  const countDepth = limitedCount(
    maxDepth,
    `The SVG image nests elements more than ${maxDepth} levels deep.`,
  );
  const countAttribute = limitedCount(
    maxAttributes,
    `The SVG image has more than ${maxAttributes} attributes.`,
  );
  const countStyle = limitedCount(
    maxStyleLength,
    `The style attributes of the SVG image are longer than ${maxStyleLength} characters.`,
  );
  let countAttributeOfElement = limitedAttributesOfElement();

  const parser = new SaxesParser(JSDOM_SAXES_OPTIONS);
  parser.on("opentagstart", () => {
    countNode();
    countDepth();
    countAttributeOfElement = limitedAttributesOfElement();
  });
  // Called as each attribute is read: before saxes stores the rest of the start tag, and before
  // it resolves the namespaces of the prefixed attributes when the start tag ends.
  parser.on("attribute", ({ name, prefix, value }) => {
    countAttributeOfElement();
    countAttribute();
    if ((name === "xmlns" || prefix === "xmlns") && value.length > maxNamespaceLength) {
      throw new ValueError(
        `A namespace of the SVG image is longer than ${maxNamespaceLength} characters.`,
      );
    }
    // A prefixed style attribute is not parsed as CSS.
    if (name === "style") {
      countStyle(value.length);
    }
  });
  parser.on("closetag", () => countDepth(-1));
  parser.on("comment", () => countNode());
  parser.on("cdata", () => countNode());
  parser.on("processinginstruction", () => countNode());
  parser.on("error", (error) => {
    throw new ValueError("The file is not a well-formed SVG image.", { cause: error });
  });
  parser.write(text).close();
}

/** Parses the text as XML, which must be well-formed with an `<svg>` root in the SVG namespace. */
function parseStandaloneSvg(text: string, window: DOMWindow): Element {
  const root = new window.DOMParser().parseFromString(text, "image/svg+xml").documentElement;
  if (root.localName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) {
    throw new ValueError("The file is not a well-formed SVG image.");
  }
  return root;
}

/** DOMPurify sanitizes in an HTML document, which cannot hold CDATA sections; their text stays. */
function replaceCdataSectionsWithText(root: Element, window: DOMWindow): void {
  const iterator = root.ownerDocument.createNodeIterator(
    root,
    window.NodeFilter.SHOW_CDATA_SECTION,
  );
  const sections: CharacterData[] = [];
  for (let node = iterator.nextNode(); node; node = iterator.nextNode()) {
    sections.push(node as CharacterData);
  }
  for (const section of sections) {
    section.replaceWith(root.ownerDocument.createTextNode(section.data));
  }
}

function findSvgRoot(fragment: DocumentFragment): Element {
  const root = fragment.firstElementChild;
  if (!root || root.localName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) {
    throw new ValueError("The SVG image has no content left after removing unsafe parts.");
  }
  return root;
}

/**
 * Removes scripts, event handlers, foreignObject, javascript: links, references to other
 * documents and editor-specific markup. Returns the cleaned SVG; the input is never stored.
 *
 * @throws ValueError if the file is not a UTF-8, well-formed SVG, declares a DOCTYPE or ENTITY,
 * or exceeds one of the `SVG_LIMITS`.
 */
export function sanitizeSvg(input: Buffer): Buffer {
  const text = decodeUtf8(input);
  if (DOCUMENT_TYPE_DECLARATION.test(text)) {
    throw new ValueError("SVG files must not contain DOCTYPE or ENTITY declarations.");
  }
  assertWithinLimits(text);
  const { window, purifier } = getToolkit();
  const root = parseStandaloneSvg(text, window);
  replaceCdataSectionsWithText(root, window);

  // DOMPurify gets the parsed tree, not the text: it would parse text again as HTML, whose tree
  // construction can turn a few hundred well-formed tags into tens of thousands of elements.
  const fragment = purifier.sanitize(root, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    RETURN_DOM_FRAGMENT: true,
  });
  // XML serialization keeps the namespaces and never writes HTML-only entities such as &nbsp;.
  const sanitized = new window.XMLSerializer().serializeToString(findSvgRoot(fragment));
  parseStandaloneSvg(sanitized, window);

  return Buffer.from(XML_DECLARATION + sanitized, "utf8");
}
