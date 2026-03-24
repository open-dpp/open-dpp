# Branding

open-dpp supports branding at two levels:

- **Instance logo**: a default logo used across the platform
- **Organization logo**: a logo configured for a specific organization

If both are set and the user is logged in, the organization logo takes precedence.

## Instance Logo

Add a logo file to your open-dpp container, either by mounting a volume or by building a custom image.

Supported image formats:

- PNG
- JPEG
- WebP
- GIF

For best performance, use a reasonably small image.

Then set `OPEN_DPP_INSTANCE_BRANDING` to the file path of that logo inside the container.

The instance logo is shown in the top-left area of the UI whenever no organization-specific logo is configured.

## Organization Logo

In open-dpp, go to **Configure organizations** in the sidebar, then upload an image in the **Image for organization profile** field.

Once uploaded, the organization logo will be displayed instead of the instance logo for that organization. This will also be visible for users visiting passports of the organization.