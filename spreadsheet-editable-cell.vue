<template>
  <td 
    v-show="active"
  >
    <input 
      ref="cellRef"
      :value="cell.value" 
    />
  </td>
  <td 
    v-show="!active"
    @click="activate"
  >
    {{ cell.value }}
  </td>
</template>

<script lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Sheet, UICell } from './spreadsheet'

export default {
  props: {
    cell: {
      type: Object as () => UICell
    },
    activeCell: {
      type: String
    }
  },

  setup(props, { emit }) {
    const cellRef = ref(null)
    const active = computed(() => 
      props.activeCell === `${props.cell.row}${props.cell.col}`
    )

    const activate = () => {
      emit('activate',  { cell: props.cell, cellRef })
    }

    return {
      active,
      activate,
      cellRef
    }
  }
}
</script>