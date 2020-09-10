<template>
  <table>
    <tr v-for="row in rows">
      <td 
        v-for="col in row"
        @click="enterInputMode(col)"
      >
        {{ col.value }}
        <div v-if="`${col.row}${col.col}` === editingCell">
          <input 
            v-model="editingValue" 
            @keyup.enter="updateCell(col)"
          />
        </div>
      </td>
    </tr>    
  </table>
</template>

<script lang="ts">
import { reactive, ref, computed } from 'vue'
import { Sheet, render, RenderedCell, updateCell } from './spreadsheet'

export default {
  setup() {
    const sheet = reactive<Sheet>({
      cells: {
        'a1': {
          value: '1',
          type: 'primitive',
        },
        'a2': {
          value: '2',
          type: 'primitive',
        },
        'b1': {
          value: '3',
          type: 'primitive',
        },
        'b2': {
          value: '4',
          type: 'primitive',
        }
      }
    })

    const editingValue = ref<string>()
    const editingCell = ref<string>()

    const rows = computed(() => render(sheet))

    return {
      rows,
      editingCell,
      editingValue,
      updateCell: (cell: RenderedCell) => {
        updateCell(sheet, cell, editingValue.value)
        editingValue.value = ''
        editingCell.value = ''
      },
      enterInputMode: (cell: RenderedCell) => {
        editingCell.value = `${cell.row}${cell.col}`
        editingValue.value = cell.value
      }
    }
  } 
}
</script>
