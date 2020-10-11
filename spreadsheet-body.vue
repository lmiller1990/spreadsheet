<template>
  <tr v-for="cells in rows">
    <spreadsheet-label-cell 
      :label="cells[0].row"
    />

    <spreadsheet-editable-cell 
      v-for="cell in cells" 
      :cell="cell"
      :activeCell="activeCell"
      @activate="activate"
    />
  </tr>
</template>

<script lang="ts">
import { Ref, ref, nextTick } from 'vue'
import { UICell } from './spreadsheet'
import SpreadsheetEditableCell from './spreadsheet-editable-cell.vue'
import SpreadsheetLabelCell from './spreadsheet-label-cell.vue'

interface Activate {
  cell: UICell
  cellRef: Ref<HTMLInputElement>
}

export default {
  components: {
    SpreadsheetEditableCell,
    SpreadsheetLabelCell,
  },

  props: {
    rows: {
      type: Array as () => UICell[][]
    }
  },

  setup() {
    const activeCell = ref('a1') // a1, b2 ...
    const activate = (payload: Activate) => {
      activeCell.value = `${payload.cell.col}${payload.cell.row}`
      nextTick(() => payload.cellRef.value.focus())
    }

    const toAlpha = (num: number) => {
      // a -> 97
      return String.fromCharCode(num + 96)
    }

    return {
      toAlpha,
      activate,
      activeCell
    }
  }
}
</script>