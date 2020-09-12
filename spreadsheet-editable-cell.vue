<template>
  <td v-show="active">
    <input :value="cell.value" ref="cellRef" />
  </td>

  <td 
    v-show="!active"
    @click="activate"
  >
    <span>
      {{ cell.value }}
    </span>
  </td>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { UICell } from './spreadsheet'

export default {
  props: {
    activeCell: {
      type: String
    },

    cell: {
      type: Object as () => UICell
    }
  },

  setup(props, { emit }) {
    const cellRef = ref(null)

    const active = computed(() => {
      return props.activeCell === `${props.cell.col}${props.cell.row}`
    })

    const activate = () => {
      emit('activate', {
        cell: props.cell,
        cellRef
      })
    }

    return {
      active,
      cellRef,
      activate
    }
  }
}
</script>