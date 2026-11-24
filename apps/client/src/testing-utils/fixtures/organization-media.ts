import type { MediaInfo } from "../../components/media/MediaInfo.interface";

/** The key of the first page in `ServedMediaPages`: it is the one requested without a cursor. */
export const FIRST_PAGE = "first";

/** What the list endpoint of the organization's media answers for each cursor. */
export type ServedMediaPages = Record<string, { result: MediaInfo[]; next: string | null }>;

export function mediaFile(id: string): MediaInfo {
  return { id, title: `${id}.png`, size: 7, mimeType: "image/png" };
}

/**
 * The body the list endpoint answers for this cursor, with a fresh object per file as in a real
 * response.
 */
export function servedMediaPage(pages: ServedMediaPages, total: number, cursor?: string) {
  const page = pages[cursor ?? FIRST_PAGE];
  if (!page) {
    throw new Error(`No page of media is served for the cursor ${cursor}`);
  }
  return {
    paging_metadata: { cursor: page.next, total_count: total },
    result: page.result.map((media) => ({ ...media })),
  };
}

/** The body the list endpoint answers when these files are all the media of the organization. */
export function onlyMediaPage(result: MediaInfo[]) {
  return servedMediaPage({ [FIRST_PAGE]: { result, next: null } }, result.length);
}

/** Eight files, newest first: one more page than the six a grid shows. */
export const newestSixMedia = ["h", "g", "f", "e", "d", "c"].map(mediaFile);
export const oldestTwoMedia = ["b", "a"].map(mediaFile);
export const eightMediaOnTwoPages: ServedMediaPages = {
  [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" },
  "after-c": { result: oldestTwoMedia, next: null },
};
