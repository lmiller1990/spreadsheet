<template>
  <button @click="undo">Undo</button>
  <button @click="redo">Redo</button>
  <button 
    v-if="selectedCell" 
    @click="insertRowAfter"
  >
    Insert row after
  </button>
  <spreadsheet-header :colCount="sheet[0].length" />
  <spreadsheet-body :rows="sheet" />
<pre v-for="state in states">
{{ state }}
</pre>
</template>

<script lang="ts">
import { mount } from '@vue/test-utils'
import { computed, reactive } from 'vue'
import { useSheet } from './composables/sheet'
import { Sheet, render } from './spreadsheet'
import SpreadsheetHeader from './spreadsheet-header.vue'
import SpreadsheetBody from './spreadsheet-body.vue'
console.log(mount)

export default {
  components: {
    SpreadsheetHeader,
    SpreadsheetBody
  },

  setup() {
    const { 
      sheet, 
      currentStateIndex, 
      selectedCell,
      insertRowAfter
    } = useSheet()

    return {
      insertRowAfter: () => {
        insertRowAfter(selectedCell.value)
      },
      selectedCell: computed(() => selectedCell.value),
      undo: () => currentStateIndex.value -= 1,
      redo: () => currentStateIndex.value += 1,
      sheet: computed(() => render(sheet.states[currentStateIndex.value])),
      states: computed(() => sheet.states.map(render))
    }
  }
}
</script>

<style>
table {
  border-collapse: collapse;
}
td {
  border: 1px solid;
  width: 100px;
  height: 100%;
}
tr {
  height: 40px;
}
input {
  padding: 0px;
  margin: 0px;
  border: none;
  width: 100%;
  height: 100%; 
  font-family: initial;
  font-size: initial;
}
td > span {
  display: flex;
  align-items: center;
  height: 100%;
}
td:first-child {
  text-align: center;
}
</style>
