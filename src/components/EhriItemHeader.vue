<script setup lang="ts">

defineProps<{
  type: string,
  name: string,
  itemUrl: string,
  otherNames: string[]
}>();

</script>

<template>
  <h2>
    <a target="_blank" v-bind:href="itemUrl" v-bind:class="type" class="external type-highlight">
      {{ name }}
    </a>
  </h2>
  <ul v-if="otherNames" class="ehri-item-alternate-names">
    <li v-for="name in otherNames">{{ name }}</li>
  </ul>
</template>