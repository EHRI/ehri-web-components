<script lang="ts">
export default {
  props: {
    type: String,
    itemUrl: String,
    meta: Object
  },
}

</script>

<template>
  <div class="ehri-item-container">
    <div class="ehri-item">
      <div v-bind:class="type" class="ehri-item-heading type-highlight">
        <slot name="heading"></slot>
      </div>
      <div class="ehri-item-details">
        <slot name="details"></slot>
      </div>
      <div class="ehri-item-body">
        <slot name="body"></slot>
      </div>
      <div v-if="meta.subitems > 0" class="ehri-item-subitems">
        <slot name="subitems"></slot>
      </div>
    </div>
    <div v-if="itemUrl" class="ehri-item-footer">
      <a target="_blank" v-bind:href="itemUrl">View this item on the EHRI Portal</a>
    </div>
  </div>
</template>
