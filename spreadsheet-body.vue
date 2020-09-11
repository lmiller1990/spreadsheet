<template>
  <tr v-for="row in sheet">
    <td>{{ row[0].row }}</td>
    <spreadsheet-editable-cell 
      v-for="cell in row"
      :cell="cell"
      :activeCell="activeCell"
      @activate="activate"
    />
  </tr> 
</template>

<script lang="ts">
import { ref, Ref, nextTick } from 'vue'
import SpreadsheetEditableCell from './spreadsheet-editable-cell.vue'
import { Sheet, UICell } from './spreadsheet'

interface Activate {
  cell: UICell
  cellRef: Ref<HTMLInputElement>
}

export default {
  components: {
    SpreadsheetEditableCell
  },

  props: {
    sheet: {
      type: Object as () => Sheet
    }
  },

  setup() {
    const activeCell = ref('')
    const activate = ({ cell, cellRef } : Activate) => {
      activeCell.value = `${cell.row}${cell.col}`
      nextTick(() => cellRef.value.focus())
    }

    return {
      activeCell,
      activate
    }
  }
}
</script>