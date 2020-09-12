<template>
  <spreadsheet-header :colCount="sheet[0].length" />
  <spreadsheet-body :rows="sheet" />
<pre>
{{ sheet }}
</pre>
</template>

<script lang="ts">
import { computed, reactive } from 'vue'
import { Sheet, render } from './spreadsheet'
import SpreadsheetHeader from './spreadsheet-header.vue'
import SpreadsheetBody from './spreadsheet-body.vue'

export default {
  components: {
    SpreadsheetHeader,
    SpreadsheetBody
  },

  setup() {
    const sheet: Sheet = reactive<Sheet>({
      cells: {
        'a1': {
          value: '100',
          type: 'primitive'
        },
        'a2': {
          value: '200',
          type: 'primitive'
        },
        'b1': {
          value: '300',
          type: 'primitive'
        },
        'b2': {
          value: '400',
          type: 'primitive'
        },
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