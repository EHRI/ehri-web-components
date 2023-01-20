<script>

import {onMounted, ref} from 'vue';
import css from '@/assets/ehri.css?inline';
import EhriItemHeader from "@/components/EhriItemHeader.vue";
import EhriItemOutline from "@/components/EhriItemOutline.vue";
import EhriRepository from "@/components/EhriRepository.vue";
import EhriDocumentaryUnit from "@/components/EhriDocumentaryUnit.vue";
import EhriHistoricalAgent from "@/components/EhriHistoricalAgent.vue";

export default {
  props: {
    id: String,
    baseUrl: {
      type: String,
      default: "https://portal.ehri-project.eu"
    }
  },

  components: {
    EhriItemHeader,
    EhriItemOutline,
    EhriHistoricalAgent,
    EhriRepository,
    EhriDocumentaryUnit,
  },

  styles: [
    css,
  ],

  setup(props) {

    const type = ref(null);
    const attributes = ref(null);
    const meta = ref(null);
    const included = ref(null);
    const loading = ref(false);
    const error = ref(null);

    onMounted(async () => {
        try {
          loading.value = true;
          let r = await fetch(`${props.baseUrl}/api/v1/${props.id}`);
          let json = await r.json();
          if (!r.ok && json.errors && json.errors[0]) {
            error.value = json.errors[0].detail;
          } else {
            attributes.value = json.data.attributes;
            type.value = json.data.type;
            meta.value = json.data.meta;
            included.value = json.included;
          }
        } catch (e) {
          error.value = e.toString();
          console.log(e);
        } finally {
          loading.value = false;
        }
      }
    );

    return {type, attributes, meta, included, loading, error};
  }
}

</script>

<template>
  <ehri-item-outline v-if="loading" v-bind:type="'loading-placeholder'" v-bind:item-url="baseUrl" v-bind:meta="{}">
    <template v-slot:heading>
      <ehri-item-header
          v-bind:name="'Loading...'"
          v-bind:type="'loading-placeholder'"
          v-bind:item-url="baseUrl"
          v-bind:other-names="['Loading...']" />
    </template>
    <template v-slot:body>
      <div v-for="_ in 4" class="loading-placeholder">Loading...</div>
    </template>
  </ehri-item-outline>
  <ehri-repository
      v-else-if="attributes && type && type === 'Repository'"
      v-bind:id="id"
      v-bind:type="type"
      v-bind:attributes="attributes"
      v-bind:meta="meta"
      v-bind:included="included"
      v-bind:base-url="baseUrl"
  />
  <ehri-documentary-unit
      v-else-if="attributes && type && type === 'DocumentaryUnit'"
      v-bind:id="id"
      v-bind:type="type"
      v-bind:attributes="attributes"
      v-bind:meta="meta"
      v-bind:included="included"
      v-bind:base-url="baseUrl"
  />
  <ehri-historical-agent
      v-else-if="attributes && type && type === 'HistoricalAgent'"
      v-bind:id="id"
      v-bind:type="type"
      v-bind:attributes="attributes"
      v-bind:meta="meta"
      v-bind:included="included"
      v-bind:base-url="baseUrl"
      />
  <div v-else-if="error !== null">
    <pre>Error requesting EHRI API data: {{ error }}</pre>
  </div>
  <div v-else>
    <pre>Unsupported type: {{ type }}</pre>
  </div>
</template>

