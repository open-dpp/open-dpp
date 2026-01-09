<script setup lang="ts">
import type { AasEditorPath, PropertyCreateEditorProps } from "../../composables/aas-drawer.ts";

import { toTypedSchema } from "@vee-validate/zod";
import { Button, Dropdown, InputText, Message } from "primevue";
import { useFieldArray, useForm } from "vee-validate";
import { computed, watch } from "vue";
import { z } from "zod";

const props = defineProps<{
  path: AasEditorPath;
  data: PropertyCreateEditorProps;
}>();

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
});

const formSchema = z.object({
  users: z.array(userSchema).min(1, "At least one user is required"),
});

export type FormValues = z.infer<typeof formSchema>;

const roles = [
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" },
];

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  validateOnInput: true, // Add this line
  initialValues: {
    users: [{ email: "", role: "" }],
  },
});

const { fields, push, remove } = useFieldArray<FormValues["users"]>("users");

watch(() => meta.value, newValue => console.log(newValue));

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const onSubmit = handleSubmit((data) => {
  console.log("Valid form data:", data);
});
</script>

<template>
  <div class="flex flex-col">
    <div>
      Create Property
      {{ props.data.valueType }}
      {{ props.path }}
    </div>
    <div>
      <form class="p-fluid" @submit.prevent="onSubmit">
        <div
          v-for="(field, index) in fields"
          :key="field.key"
          class="p-3 mb-3 border-round border-1 surface-border"
        >
          <!-- Email -->
          <div class="flex flex-col gap-2 field">
            <label>Email</label>
            <InputText
              v-model="field.value.email"
              :invalid="showErrors && errors[`users[${index}].email`]"
            />
            <Message v-if="showErrors" size="small" severity="error" variant="simple">
              {{ errors[`users[${index}].email`] }}
            </Message>
          </div>

          <!-- Role -->
          <div class="field mb-2">
            <label>Role</label>
            <Dropdown
              v-model="field.value.role"
              :options="roles"
              option-label="label"
              option-value="value"
              placeholder="Select role"
              :class="{ 'p-invalid': errors[`users.${index}.role`] }"
            />
            <small class="p-error">
              {{ errors[`users.${index}.role`] }}
            </small>
          </div>

          <!-- Remove -->
          <Button
            v-if="fields.length > 1"
            icon="pi pi-trash"
            severity="danger"
            text
            @click="remove(index)"
          />
        </div>

        <!-- Array-level error -->
        <Message v-if="errors.users" severity="error">
          {{ errors.users }}
        </Message>

        <div class="flex gap-2 mt-3">
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add User"
            @click="push({ email: '', role: '' })"
          />
          <Button type="submit" label="Submit" />
        </div>
      </form>
    </div>
  </div>
</template>
