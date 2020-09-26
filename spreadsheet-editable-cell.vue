<template>
  <td v-show="active">
    <input :value="cell.value" ref="cellRef" @keyup.enter="handleUpdate" />
  </td>

  <td 
    v-show="!active"
    @click="activate"
  >
    <span>
      {{ cell.displayValue() }}
    </span>
  </td>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useSheet } from './composables/sheet'
import { UICell, updateCell } from './spreadsheet'

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
    const { sheet, update } = useSheet()
    const handleUpdate = (evt: any) => {
      update(
        `${props.cell.col}${props.cell.row}`,
        evt.target.value
      )
    }

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
      handleUpdate,
      active,
      cellRef,
      activate
    }
  }
}
</script>