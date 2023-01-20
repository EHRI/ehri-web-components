<script setup lang="ts">

import EhriItemOutline from './EhriItemOutline.vue';
import EhriItemHeader from './EhriItemHeader.vue';
import {computed} from "vue";
import type {DocumentaryUnitAttrs, MetaAttrs, RepositoryItemData} from "@/api";

const props = defineProps<{
  id: string,
  type: string,
  attributes: DocumentaryUnitAttrs,
  meta: MetaAttrs,
  included: RepositoryItemData[],
  baseUrl: string
}>();

const itemUrl = computed(() => {
  return props.baseUrl + '/units/' + props.id;
});

const summary = computed(() => {
  return props.attributes.descriptions[0]?.scopeAndContent?.split(/\r?\n\r?\n/).splice(0, 4);
});

</script>

<template>
  <ehri-item-outline v-bind:type="type" v-bind:item-url="itemUrl" v-bind:meta="meta">
    <template v-slot:heading>
      <ehri-item-header
          v-bind:name="attributes.descriptions[0].name"
          v-bind:type="type"
          v-bind:item-url="itemUrl"
          v-bind:other-names="attributes.descriptions[0].parallelFormsOfName" />
    </template>
    <template v-slot:body>
      <p v-for="p in summary">{{ p }}</p>
    </template>
    <template v-slot:details>
      <ul v-if="included">
        <li v-for="item in included.filter(i => i.type === 'Repository')">
          <a target="_blank" v-bind:href="'https://portal.ehri-project.eu/institutions/' + item.id" class="alt">
            {{ item.attributes.name }}
          </a>
        </li>
        <li v-if="attributes.localId">{{ attributes.localId }}</li>
        <li v-if="attributes.descriptions[0].language">{{ attributes.descriptions[0].language }}</li>
        <li v-if="attributes.descriptions[0].extentAndMedium">{{ attributes.descriptions[0].extentAndMedium }}</li>
      </ul>
    </template>
  </ehri-item-outline>
</template>

