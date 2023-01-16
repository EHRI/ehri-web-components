<script lang="ts">

import css from '@/assets/ehri.css?inline';
import type {ItemJson} from "@/api";
import EhriItemOutline from './EhriItemOutline.vue';

export default {
  props: {
    id: String,
  },

  components: {EhriItemOutline},

  data: function() {
    return {
      type: null,
      itemUrl: null,
      attributes: null,
      meta: null,
      loading: true,
      error: null,
    }
  },

  async mounted() {
    try {
      let r = await fetch("https://portal.ehri-project.eu/api/v1/" + this.id);
      let json = await r.json() as ItemJson;
      this.attributes = json.data.attributes;
      this.type = json.data.type;
      this.meta = json.data.meta;
      switch (this.type) {
        case "DocumentaryUnit":
          this.itemUrl = "https://portal.ehri-project.eu/units/" + this.id;
          break;
          case "Repository":
            this.itemUrl = "https://portal.ehri-project.eu/institutions/" + this.id;
            break;
        case "HistoricalAgent":
          this.itemUrl = "https://portal.ehri-project.eu/authorities/" + this.id;
          break;
          case "VirtualUnit":
            this.itemUrl = "https://portal.ehri-project.eu/virtual/" + this.id;
            break;
      }
    } catch (e) {
      this.error = e.error;
    } finally {
      this.loading = false;
    }
  },

  computed: {
    otherNames: function() {
      if (this.attributes && this.attributes.otherFormsOfName) {
        let ofn = this.attributes.otherFormsOfName || [];
        let pfn = this.attributes.parallelFormsOfName || [];
        return ofn.concat(pfn);
      } else {
        return [];
      }
    }
  },

  styles: [css],

}

</script>

<template>
  <ehri-item-outline v-if="attributes" v-bind:type="type" v-bind:item-url="itemUrl" v-bind:meta="meta">
    <template v-slot:heading>
      <h2>
        <a target="_blank" v-bind:href="itemUrl" class="external type-highlight Repository">
          {{ attributes.name }}
        </a>
      </h2>
      <ul v-if="otherNames" class="ehri-item-alternate-names">
        <li v-for="name in otherNames">{{ name }}</li>
      </ul>
      {{ attributes.title }}
    </template>
    <template v-slot:body>
      {{ attributes.history }}
    </template>
    <template v-slot:details>

      <ul class="concise-address">
        <li v-if="attributes.address && attributes.address.country && attributes.address.countryCode">
          <a target="_blank" v-bind:href="'https://portal.ehri-project.eu/countries/' + attributes.address.countryCode.toLowerCase()"
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
  <div v-else>
    <h2>Loading data...</h2>
  </div>
</template>

