import { defineCustomElement } from 'vue'
import EhriItem from '@/components/EhriItem.cs.vue';

// convert into custom element constructor
const EhriItemElement = defineCustomElement(EhriItem);

// register
customElements.define('ehri-item', EhriItemElement);