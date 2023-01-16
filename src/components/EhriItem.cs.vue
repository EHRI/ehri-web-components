<script lang="ts">

import css from '@/assets/ehri.css?inline';
import type {ItemJson} from "@/api";
import EhriItemOutline from './EhriItemOutline.vue';
import EhriRepository from "@/components/EhriRepository.vue";

export default {
  props: {
    id: String,
  },

  components: {EhriItemOutline, EhriRepository},

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

  styles: [css],
}

</script>

<template>
  <ehri-repository
      v-if="attributes"
      v-bind:id="id"
      v-bind:type="type"
      v-bind:attributes="attributes"
      v-bind:item-url="itemUrl"
      v-bind:meta="meta"
      />
  <div v-else>
    <h2>Loading data...</h2>
  </div>
</template>

