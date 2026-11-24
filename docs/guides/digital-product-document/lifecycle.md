# Lifecycle

{{ $frontmatter.type }} have a lifecycle containing the following stages:

- [Draft](#Draft)
- [Published](#Published)
- [Archived](#Archived)

## Draft

At the beginning of the lifecycle, a {{ typeLowerSingular }} starts in the stage **Draft**.

In the draft mode you can do the following operations on the {{ typeLowerSingular }}:

- Edit it
- Publish it
- Archive it
- Delete it

## Published

When published, you can do the following operations on the {{ typeLowerSingular }}:

- Edit it (see below for restrictions)
- Archive it

Published templates are read-only: their structure and values can no longer be changed.
Passports created from a published template keep the template's structure. You can still
overwrite their data values and add or delete table rows, but you cannot add, remove or
change submodels, elements or table columns. Passports created from a draft template or
without a template stay fully editable.

## Archived

When archived, you can do the following operations on the {{ typeLowerSingular }}:

- Restore it to the previous state.

<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();
const typeLowerSingular = computed(() =>
  String(frontmatter.value.type ?? "").toLowerCase().slice(0, -1),
);
</script>
