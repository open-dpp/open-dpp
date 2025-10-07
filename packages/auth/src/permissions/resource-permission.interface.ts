/**
 * Describes the permissions associated with a specific resource.
 *
 * @interface ResourcePermission
 * @property {string} type - Identifies the permission type. (keycloak=rsname)
 * @property {string} resource - Specifies the resource for which the permission is granted. (keycloak=rsid)
 * @property {string[]} [scopes] - (Optional) A list of scopes defining the specific actions allowed on the resource.
 */
export interface ResourcePermission {
  type: "organization";
  resource: string;
  scopes?: string[];
}
