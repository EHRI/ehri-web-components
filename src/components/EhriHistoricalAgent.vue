<script setup lang="ts">

import EhriItemOutline from './EhriItemOutline.vue';
import EhriItemHeader from './EhriItemHeader.vue';
import {computed} from "vue";
import type {HistoricalAgentAttrs, MetaAttrs} from "@/api";

const props = defineProps<{
  id: string,
  type: string,
  attributes: HistoricalAgentAttrs,
  meta: MetaAttrs,
  baseUrl: string
}>();

const otherNames = computed(() => {
  let ofn = props.attributes.otherFormsOfName || [];
  let pfn = props.attributes.parallelFormsOfName || [];
  return ofn.concat(pfn);
});

const itemUrl = computed(() => {
  return props.baseUrl + '/authorities/' + props.id;
});

const summary = computed(() => {
  return props.attributes.history?.split(/\r?\n\r?\n/).splice(0, 4);
});

</script>

<template>
  <ehri-item-outline v-bind:type="type" v-bind:item-url="itemUrl" v-bind:meta="meta">
    <template v-slot:heading>
      <ehri-item-header
          v-bind:name="attributes.name"
          v-bind:type="type"
          v-bind:item-url="itemUrl"
          v-bind:other-names="otherNames" />
    </template>
    <template v-slot:body>
      <p v-for="p in summary">{{ p }}</p>
    </template>
  </ehri-item-outline>
</template>

