import type { DOMWindow } from "jsdom";
import { Buffer } from "node:buffer";
import { ValueError } from "@open-dpp/exception";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>\n';
// Checked on the raw text before any parser runs: jsdom's XML parser expands internal entities.
const DOCUMENT_TYPE_DECLARATION = /<!(?:DOCTYPE|ENTITY)/i;

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

/** The text must open as a standalone SVG: well-formed XML with an `<svg>` root in the SVG namespace. */
function assertStandaloneSvg(text: string, window: DOMWindow): void {
  const root = new window.DOMParser().parseFromString(text, "image/svg+xml").documentElement;
  if (root.localName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) {
    throw new ValueError("The file is not a well-formed SVG image.");
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
 * @throws ValueError if the file is not a UTF-8, well-formed SVG or declares a DOCTYPE or ENTITY.
 */
export function sanitizeSvg(input: Buffer): Buffer {
  const text = decodeUtf8(input);
  if (DOCUMENT_TYPE_DECLARATION.test(text)) {
    throw new ValueError("SVG files must not contain DOCTYPE or ENTITY declarations.");
  }
  const { window, purifier } = getToolkit();
  assertStandaloneSvg(text, window);

  const fragment = purifier.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    RETURN_DOM_FRAGMENT: true,
  });
  // XML serialization keeps the namespaces and never writes HTML-only entities such as &nbsp;.
  const sanitized = new window.XMLSerializer().serializeToString(findSvgRoot(fragment));
  assertStandaloneSvg(sanitized, window);

  return Buffer.from(XML_DECLARATION + sanitized, "utf8");
}
