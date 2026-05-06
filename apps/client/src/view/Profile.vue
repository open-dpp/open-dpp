<script lang="ts" setup>
import ProfileForm from "../components/profile/ProfileForm.vue";
import InvitationsTable from "./organizations/InvitationsTable.vue";
</script>

<template>
  <section>
    <div class="flex flex-row gap-3 p-3">
      <ProfileForm />
    </div>
    <Card>
      <template #content>
        <InvitationsTable />
      </template>
    </Card>
  </section>
</template>
