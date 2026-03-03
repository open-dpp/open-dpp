import type {
  AssetAdministrationShellResponseDto,
  AssetInformationDto,
} from "@open-dpp/dto";
import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";
import type { MediaFileCollectionProps } from "./media-file.ts";
import { ref } from "vue";
import { useMediaFileCollection } from "./media-file.ts";

export interface AasGalleryProps extends MediaFileCollectionProps {}

export function useAasGallery(props: AasGalleryProps) {
  const assetInformation = ref<AssetInformationDto>();
  const { files, download, add, remove, modify, move } = useMediaFileCollection(props);

  async function downloadDefaultThumbnails(assetAdministrationShell: AssetAdministrationShellResponseDto) {
    assetInformation.value = { ...assetAdministrationShell.assetInformation };

    await download(assetInformation.value.defaultThumbnails.map(thumbnail => thumbnail.path));
  }

  async function addImage(image: MediaInfo) {
    const thumbnail = { path: image.id, contentType: image.mimeType };
    if (assetInformation.value) {
      if (await add(thumbnail.path)) {
        assetInformation.value.defaultThumbnails.push(thumbnail);
      }
    }
  }

  async function removeImage(image: MediaInfo) {
    if (assetInformation.value) {
      assetInformation.value.defaultThumbnails
        = assetInformation.value.defaultThumbnails.filter(
          thumbnail => thumbnail.path !== image.id,
        );
      remove(image.id);
    }
  }

  function moveImage(image: MediaInfo, newIndex: number) {
    if (assetInformation.value) {
      const foundIndex = assetInformation.value.defaultThumbnails.findIndex(
        thumbnail => thumbnail.path === image.id,
      );
      if (foundIndex !== -1) {
        const thumbnail = assetInformation.value.defaultThumbnails.splice(
          foundIndex,
          1,
        )[0];
        if (thumbnail) {
          assetInformation.value.defaultThumbnails.splice(
            newIndex,
            0,
            thumbnail,
          );
        }
      }
      move(image.id, newIndex);
    }
  }

  async function modifyImage(oldMediaInfo: MediaInfo, newMediaInfo: MediaInfo) {
    if (assetInformation.value) {
      const thumbnail = assetInformation.value.defaultThumbnails.find(
        thumbnail => thumbnail.path === oldMediaInfo.id,
      );
      if (!thumbnail) {
        return;
      }
      await modify(oldMediaInfo.id, newMediaInfo.id);
      thumbnail.path = newMediaInfo.id;
      thumbnail.contentType = newMediaInfo.mimeType;
    }
  }

  return {
    assetInformation,
    files,
    downloadDefaultThumbnails,
    addImage,
    removeImage,
    modifyImage,
    moveImage,
  };
}
