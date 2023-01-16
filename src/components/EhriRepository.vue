<script setup lang="ts">

import EhriItemOutline from './EhriItemOutline.vue';
import type {MetaAttrs, RepositoryAttrs} from "@/api";
import {computed} from "vue";

const props = defineProps<{
  id: string,
  itemUrl: string,
  type: string,
  attributes: RepositoryAttrs,
  meta: MetaAttrs
}>();

const otherNames = computed(() => {
  let ofn = props.attributes.otherFormsOfName || [];
  let pfn = props.attributes.parallelFormsOfName || [];
  return ofn.concat(pfn);
})

</script>

<template>
  <ehri-item-outline v-bind:type="type" v-bind:item-url="itemUrl" v-bind:meta="meta">
    <template v-slot:heading>
      <h2>
        <a target="_blank" v-bind:href="itemUrl" class="external type-highlight Repository">
          {{ attributes.name }}
        </a>
      </h2>
      <ul v-if="otherNames" class="ehri-item-alternate-names">
        <li v-for="name in otherNames">{{ name }}</li>
      </ul>
    </template>
    <template v-slot:body>
      {{ attributes.history }}
    </template>
    <template v-slot:details>
      <ul class="concise-address">
        <li v-if="attributes.address && attributes.address.country && attributes.address.countryCode">
          <a target="_blank" v-bind:href="'https://portal.ehri-project.eu/countries/' +
          attributes.address.countryCode?.toLowerCase()"
             class="alt">
            {{ attributes.address.country }}
          </a>
        </li>
        <li v-if="attributes.address && attributes.address.streetAddress">{{ attributes.address.streetAddress }}</li>
        <li v-if="attributes.address.city">{{ attributes.address.city }}</li>
        <li v-if="meta.updated">Updated {{ meta.updated }}</li>
      </ul>
    </template>
  </ehri-item-outline>
</template>

