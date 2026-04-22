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

- Edit it
- Archive it

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
