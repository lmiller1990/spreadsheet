<template>
  <table>
    <spreadsheet-header :colCount="sheet[0].length" />
    <spreadsheet-body :sheet="sheet" />
  </table>
  <pre>
    {{ sheet }}
  </pre>
</template>

<script lang="ts">
import { reactive, ref, computed } from 'vue'
import SpreadsheetHeader from './spreadsheet-header.vue'
import SpreadsheetBody from './spreadsheet-body.vue'
import { render, Sheet } from './spreadsheet'

export default {
  components: {
    SpreadsheetHeader,
    SpreadsheetBody
  },

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

    return {
      sheet: computed(() => render(sheet))
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
  height: 30px;
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

td:first-child {
  text-align: center;
}
</style>
