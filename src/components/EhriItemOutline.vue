<script setup lang="ts">
import {ref} from "vue";
import type {MetaAttrs} from "@/api";

interface Props {
  type: string
  itemUrl: string
  meta: MetaAttrs
}

defineProps<Props>();

// To default to
const truncate = ref<boolean>(false);

</script>

<template>
  <div class="ehri-item-container">
    <div class="ehri-item">
      <div v-bind:class="type" class="ehri-item-heading type-highlight">
        <slot name="heading"></slot>
      </div>
      <div class="ehri-item-details">
        <slot name="details">
          <ul>
            <li v-if="meta && meta.updated">Updated {{ meta.updated }}</li>
          </ul>
        </slot>
      </div>
      <div class="ehri-item-body" v-bind:class="{truncated: truncate}" v-on:click="truncate = false">
        <slot name="body"></slot>
      </div>
      <div v-if="meta && meta.subitems && meta.subitems > 0" class="ehri-item-subitems">
        <slot name="subitems"></slot>
      </div>
    </div>
    <div v-if="itemUrl" class="ehri-item-footer">
      <a target="_blank" v-bind:href="itemUrl">View this item on the EHRI Portal</a>
    </div>
  </div>
</template>
