import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IdShortPath } from "../common/id-short-path";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { ReferenceElement } from "../submodel-base/reference-element";
import { createAasObject } from "./aas-object";
import { Permission } from "./permission";
import { PermissionPerObject, PermissionPerObjectSchema } from "./permission-per-object";
import { SubjectAttributes, SubjectAttributesSchema } from "./subject-attributes";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../../activity-history/domain/change-tracker";
import { PolicyAdded } from "../../../activity-history/domain/change-events/policy-added";
import { PolicyDeleted } from "../../../activity-history/domain/change-events/policy-deleted";
import { PolicyModified } from "../../../activity-history/domain/change-events/policy-modified";

export const AccessPermissionRuleSchema = z.object({
  targetSubjectAttributes: SubjectAttributesSchema,
  permissionsPerObject: z.array(PermissionPerObjectSchema),
});

export class AccessPermissionRule implements ITrackable {
  public tracker = ChangeTracker.create();
  private constructor(
    public readonly targetSubjectAttributes: SubjectAttributes,
    private _permissionsPerObject: PermissionPerObject[],
  ) {}

  static create(data: {
    targetSubjectAttributes: SubjectAttributes;
    permissionsPerObject?: PermissionPerObject[];
  }): AccessPermissionRule {
    return new AccessPermissionRule(data.targetSubjectAttributes, data.permissionsPerObject ?? []);
  }

  withTracking(changeTracker?: ChangeTracker) {
    return withTrackingHelper(changeTracker, this);
  }

  get permissionsPerObject(): PermissionPerObject[] {
    return this._permissionsPerObject;
  }

  deletePermissionPerObject(
    object: IdShortPath,
    options: { exactPathMatch?: boolean } = { exactPathMatch: false },
  ): void {
    const keepPermissions = [];
    for (const permissionsPerObject of this.permissionsPerObject) {
      const idShortPath = IdShortPath.create({ path: permissionsPerObject.object.idShort });
      if (!options.exactPathMatch && !idShortPath.isChildOf(object)) {
        keepPermissions.push(permissionsPerObject);
      } else if (options.exactPathMatch && !idShortPath.isEqual(object)) {
        keepPermissions.push(permissionsPerObject);
      }
    }

    for (const permissionsPerObject of this.permissionsPerObject) {
      if (!keepPermissions.find((p) => p.object.idShort === permissionsPerObject.object.idShort)) {
        this.tracker.track(
          PolicyDeleted.create({
            userRole: this.targetSubjectAttributes.userRole,
            memberRole: this.targetSubjectAttributes.memberRole,
            object: permissionsPerObject.object,
          }),
        );
      }
    }

    this._permissionsPerObject = keepPermissions;
  }

  hasPermissionForObject(permissionPerObject: PermissionPerObject): boolean {
    return this.permissionsPerObject.some(
      (p) => p.object.idShort === permissionPerObject.object.idShort,
    );
  }

  addPermissionPerObject(permissionPerObject: PermissionPerObject): void {
    if (this.hasPermissionForObject(permissionPerObject)) {
      throw new ValueError(
        `Permission for subject { userRole: ${this.targetSubjectAttributes.userRole}, memberRole: ${this.targetSubjectAttributes.memberRole} } and object ${permissionPerObject.object.idShort} already exists`,
      );
    }
    this.permissionsPerObject.push(permissionPerObject);
  }

  modifyPermissionForObject(object: ReferenceElement, permissions: Permission[]): void {
    const permissionsPerObject = this.permissionsPerObject.find(
      (p) => p.object.idShort === object.idShort,
    );
    if (!permissionsPerObject) {
      throw new ValueError(
        `Permission for subject { userRole: ${this.targetSubjectAttributes.userRole}, memberRole: ${this.targetSubjectAttributes.memberRole} } and object ${object.idShort} does not exist`,
      );
    }
    const oldPermissions = permissionsPerObject.permissions;
    permissionsPerObject.permissions = permissions;
    this.tracker.track(
      PolicyModified.create({
        userRole: this.targetSubjectAttributes.userRole,
        memberRole: this.targetSubjectAttributes.memberRole,
        object: object,
        oldValue: oldPermissions,
        newValue: permissions,
      }),
    );
  }

  movePolicy(oldObject: IdShortPath, newObject: IdShortPath, changeTracker: ChangeTracker): void {
    // Find all entries in this rule that are oldObject or its descendants
    const entriesToMove: PermissionPerObject[] = [];
    for (const entry of this.permissionsPerObject) {
      if (entry.objectIsEqualOrChildOf(oldObject)) {
        entriesToMove.push(entry);
      }
    }

    // If nothing to move in this rule, return early
    if (entriesToMove.length === 0) {
      return;
    }

    // Sort by path length descending (depth-first: longest first)
    entriesToMove.sort(
      (a, b) => b.object.getIdShortPath().length() - a.object.getIdShortPath().length(),
    );

    // Build set of new paths we'll be creating
    const newPaths = new Set<string>();
    const movedEntries: PermissionPerObject[] = [];

    for (const entry of entriesToMove) {
      const oldFullPath = entry.object.getIdShortPath();
      // Calculate relative path from oldObject
      const relative = oldFullPath.relativePath(oldObject);
      const newFullPath = newObject.concat(relative);
      newPaths.add(newFullPath.toString());

      // Track deletion of old entry
      changeTracker.track(
        PolicyDeleted.create({
          userRole: this.targetSubjectAttributes.userRole,
          memberRole: this.targetSubjectAttributes.memberRole,
          object: entry.object,
        }),
      );

      // Create moved entry with copied permissions
      movedEntries.push(entry.move(createAasObject(newFullPath)));

      // Track addition of new entry
      changeTracker.track(
        PolicyAdded.create({
          userRole: this.targetSubjectAttributes.userRole,
          memberRole: this.targetSubjectAttributes.memberRole,
          object: createAasObject(newFullPath),
          value: entry.permissions,
        }),
      );
    }

    // Build new permissionsPerObject array
    // Keep entries that are NOT being moved AND NOT being overwritten
    const newPermissionsPerObject = this.permissionsPerObject.filter((e) => {
      // Remove if this is one of the entries being moved
      if (entriesToMove.some((m) => m.object.getIdShortPath().isEqual(e.object.getIdShortPath()))) {
        return false;
      }
      // Remove if this path is being overwritten
      if (newPaths.has(e.object.getIdShortPath().toString())) {
        return false;
      }
      return true;
    });

    // Add the moved entries
    newPermissionsPerObject.push(...movedEntries);

    // Update the internal array (using private access within the class)
    this._permissionsPerObject = newPermissionsPerObject;
  }

  static fromPlain(json: unknown): AccessPermissionRule {
    const parsed = AccessPermissionRuleSchema.parse(json);
    return AccessPermissionRule.create({
      targetSubjectAttributes: SubjectAttributes.fromPlain(parsed.targetSubjectAttributes),
      permissionsPerObject: parsed.permissionsPerObject.map(PermissionPerObject.fromPlain),
    });
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    let filteredPermissionsPerObject: PermissionPerObject[] = [];
    if (options?.context?.filterSubmodels) {
      for (const submodel of options.context.filterSubmodels) {
        filteredPermissionsPerObject.push(
          ...this.permissionsPerObject.filter((p) =>
            IdShortPath.create({ path: p.object.idShort }).isChildOf(
              IdShortPath.create({ path: submodel.idShort }),
            ),
          ),
        );
      }
    } else {
      filteredPermissionsPerObject = this.permissionsPerObject;
    }
    return {
      targetSubjectAttributes: this.targetSubjectAttributes.toPlain(),
      permissionsPerObject: filteredPermissionsPerObject.map((p) => p.toPlain()),
    };
  }
}
