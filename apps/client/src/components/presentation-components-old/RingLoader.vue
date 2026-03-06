<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    color?: string;
    size?: string;
    margin?: string;
    radius?: string;
  }>(),
  {
    loading: true,
    color: "#5dc596",
    size: "120px",
    margin: "2px",
    radius: "100%",
  },
);

const spinnerStyle = computed(() => {
  return {
    height: props.size,
    width: props.size,
    border: `${Number.parseFloat(props.size) / 10}px solid${props.color}`,
    opacity: 0.4,
    borderRadius: props.radius,
  };
});
</script>

<template>
  <div v-show="loading" class="v-spinner">
    <div
      class="v-ring v-ring1"
      :style="{ height: size, width: size, position: 'relative' }"
    >
      <div class="v-ring v-ring2" :style="{ ...spinnerStyle }" />
      <div class="v-ring v-ring3" :style="{ ...spinnerStyle }" />
    </div>
  </div>
</template>

<style>
.v-spinner .v-ring {
}

.v-spinner .v-ring1 {
}

.v-spinner .v-ring2 {
  -webkit-animation: v-ringRightRotate 2s 0s infinite linear;
  animation: v-ringRightRotate 2s 0s infinite linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  perspective: 800px;
  position: absolute;
  top: 0;
  left: 0;
}

.v-spinner .v-ring3 {
  -webkit-animation: v-ringLeftRotate 2s 0s infinite linear;
  animation: v-ringLeftRotate 2s 0s infinite linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  perspective: 800px;
  position: absolute;
  top: 0;
  left: 0;
}

@-webkit-keyframes v-ringRightRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);
  }
}

@keyframes v-ringRightRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);
  }
}

@-webkit-keyframes v-ringLeftRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);
  }
}

@keyframes v-ringLeftRotate {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);
  }
}
</style>
