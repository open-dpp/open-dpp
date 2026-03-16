import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import { InstanceSettingsDocument } from "../schemas/instance-settings.schema";

export class InstanceSettingsMapper {
  static toDomain(document: InstanceSettingsDocument): InstanceSettings {
    const props: InstanceSettingsDbProps = {
      id: document._id,
      signupEnabled: document.signupEnabled,
    };
    return InstanceSettings.loadFromDb(props);
  }
}
