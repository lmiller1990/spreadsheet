## Implementing Undo and Redo

This is the fifth and final entry in a series where we build a simple spreadsheet engine, with Vue frontend. In this section we clean up some edge cases, and add the final feature: the ability to add increase the size of the sheet by adding new rows and columns. You click on a row/column, then click "insert before" or "insert after" to add a row/column.

![](https://raw.githubusercontent.com/lmiller1990/electic/master/screenshots/ss0.png)

## Typing up some loose ends

We have a few functions that only works under very specific circumstances at the moment; specifically `updateCell` will error out if the `cell` doesn't exist, and `deriveFormula` only works if all the cells contain valid numbers. Let's fix those, starting with `deriveFormula`. We can use TDD to make this easier. The current test for `deriveFormula` looks like this:

```ts
test('deriveFormula', () => {
  const sheet = createSheet()
  const actual = deriveFormula(sheet.states[0], sheet.states[0]['b2'])
  expect(actual).toBe('300')
})
```

This is the "happy path" where every cell is a number and the formula (which is =SUM(a1, a1)). Add a "sad" path:

```ts
describe('deriveFormula', () => {
  it('returns sum on the happy path', () => {
    const sheet = createSheet()
    const actual = deriveFormula(sheet.states[0], sheet.states[0]['b2'])
    expect(actual).toBe('300')
  })

  it('handles missing values', () => {
    const state: Cells = { 
      'a1': {
        value: '=SUM(a2)',
        type: 'formula'
      },
    }
    const actual = deriveFormula(state, state['a1'])
    expect(actual).toBe('NaN')
  })
})
```

In this case, `a2` does not exist, so we get an error when running the test. I've decided the best way to handle an invalid formula calcuation is just return NaN. Update `deriveFormula`:

```ts
export function deriveFormula(state: Cells, cell: Cell): string {
  const [_, matches] = cell.value.match(/=SUM\((.*)\)/)
  const indexes = matches.split(',')
  const invalid = indexes.some(x => {
    if (!state[x.trim()]) {
      return true
    }

    if (isNaN(parseInt(state[x.trim()].value))) {
      return true
    }
  })

  if (invalid) {
    return 'NaN'
  }
}
```

I added a check to see if either the cell doesn't exist, or the value is not a number. The test passes!

## Updating updateCell

`updateCell` has a probem, too; it assumes the cell exists in the spreadsheet data structure. We define a spreadsheet like this:

```ts
const sheet = {
  states: [
    {
      a1: {...}
      b4: {...}
    }
  ]
}
```

We render blank cells in the UI for the cells that are not defined (eg a2, a3, b1, b2, b3 in this case). When the user attempts to add a value to a cell that is not defined explicitly in the `sheet` state, it will error out:

```ts
export function updateCell(state: Cells, cell: UpdateCell) { 
  newState[cell.index].value = cell.value
  newState[cell.index].type = inferType(cell)
  return newState 
}
```

`newState[cell.index].value = cell.value` assumes `newState[cell.index]` exists. What we need to do is create the cell, if it doesn't already. Update `updateCell`:

```ts 
export function updateCell(state: Cells, cell: UpdateCell) {
  const newState: Cells = JSON.parse(JSON.stringify(state))

  if (!newState[cell.index]) {
    newState[cell.index] = { 
      value: '',
      type: 'primitive'
    }
  }

  newState[cell.index].value = cell.value
  newState[cell.index].type = inferType(cell) 
  return newState 
}
```

Easy - just define a new, empty primitive and let the rest of the logic do it's job.

## Implementing insertRow

Now to add the new feature - an `insertRow` function. I'd like to be able to insert a row before *or* after a selected row (or column). I will just be implementing `insertRow`. `insertColumn` is similar, and I will leave it as an exercise (see the source code for the final solution).

So when inserting a row, we need two things: the row in question, and whether we are inserting before or after. Let's start with some tests. you might notice something a little strange - read on.

```ts
describe('insertRow', () => {
  it('inserts a row in between two rows', () => {
    const state: Cells = {
      'a1': {
        type: 'primitive',
        value: '1'
      }, 
      'a2': {
        type: 'primitive',
        value: '2'
      },
    }
    const expected: Cells = {
      'a1': {
        type: 'primitive',
        value: '1'
      },
      'a3': {
        type: 'primitive',
        value: '2'
      },
    }
    const actual = insertRow(state, { at: 1, position: 'after' })
    expect(actual).toEqual(expected)
  })

  it('inserts a row at the end', () => {
    const state: Cells = {
      'a1': {
        type: 'primitive',
        value: '1'
      },
    }
    const expected: Cells = {
      'a1': {
        type: 'primitive',
        value: '1'
      },
      'a2': {
        type: 'primitive',
        value: ''
      },
    }
    const actual = insertRow(state, { at: 1, position: 'after' })
    expect(actual).toEqual(expected)
  })
})
```

You might expect that given:

```ts
{
  'a1': {
    type: 'primitive',
    value: '1'
  }, 
  'a2': {
    type: 'primitive',
    value: '2'
  }
}
```

When inserting a row, you might get:

```ts
{
  'a1': {
    type: 'primitive',
    value: '1'
  }, 
  'a2': {
    type: 'primitive',
    value: ''
  },
  'a3': {
    type: 'primitive',
    value: '2'
  }
}
```

But this doesn't fit into our data structure and model. Remember, we only want to save cells in our data structure that actually have some content - any empty row does not, so all we need to do is increase the row number for any row appearing *after* the point we inserted a row. In this case `a2` becomes `a3`. The `render` function will take care of rendering empty cells on the second row for us.

Now the implementation:

```ts
export interface InsertRow {
  at: number // 1, 2, 3...
  position: 'before' | 'after'
}

export function addRow(state: Cells, { at, position }: InsertRow): Cells {
  // at the end
  const { rows } = calcMaxDimensions(state)
  if (rows === at) {
    const newState: Cells = JSON.parse(JSON.stringify(state))
    newState[`a${rows + 1}`] = { type: 'primitive', value: '' }
    return newState
  } 

  // inserting in between existing rows
  const newState: Cells = {}

  for (const key of Object.keys(state)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)

    if (parseInt(row) <= at) {
      newState[`${col}${row}`] = state[`${col}${row}`]
    } else {
      newState[`${col}${parseInt(row) + 1}`] = state[`${col}${row}`]
    } 
  }

  return newState
}
```

There are two cases to consider: when inserting a new row at the very end of the table, and adding a row in the middle of the table.

For scenario 1, a row at the end of the table, we just add a new row on with an empty `primitive` cell. No need to increase the other cell's row index by 1. We can determine if this is the case by checking if the `at` value (the row we want to insert "at") is the same as the total rows in the table. We can do this easily using our `calcMaxDimensions` function. 

In the case we want to add a row in the middle of the table, we need to increase the row for all following rows. For example, if our sheet has 2 rows, and we want to insert a new row after the first row, we should increase all the following rows by 1.

For now, I am assuming we are inserting *after* the supplied row number - I will leave `before` as an exercise, (see the source code for the solution).

## Updating the UI

Now we have all the tools needed to insert rows to the spreadsheet - let's update the UI so the user can actually insert a new row! We need a way to specify after which row to insert to a new row - let's add a new variable and function to track this. Add it in to the sheet composable, (`composables/sheet.ts`). I will also add an `insertRowAfter` function which wraps `insertRow`:

```ts
import { computed, reactive, ref, readonly } from 'vue'
import { Sheet, render, UpdateCell, updateCell, insertRow } from '../spreadsheet'

// ... removed for brevity ... 

const selectedCell = ref<number>()

function setSelectedCell(cell: number) {
  selectedCell.value = cell
}

function insertRowAfter(row: number) {
  const newState = addRow(sheet.states[currentStateIndex.value], { at: row, position: 'after' })
  sheet.states.push(newState)
  currentStateIndex.value += 1
}

export function useSheet() {
  return {
    selectedCell: readonly(selectedCell),
    insertRowAfter,
    sheet,
    setSelectedCell,
    update,
    currentStateIndex
  }
}
```

I have also made `selectedCell` readonly - I'd like to enforce updating the `selectedCell` with a `setSelectedCell` function. We are sticking to the idea of immutability and ensuring undo/redo continue working by creating a brand new state when we insert a row, and incrementing `currentStateIndex`.

Update `app.vue` to use the new functions, andd add a button so the user can actually insert a row:

```html
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
import { computed, reactive } from 'vue'
import { useSheet } from './composables/sheet'
import { Sheet, render } from './spreadsheet'
import SpreadsheetHeader from './spreadsheet-header.vue'
import SpreadsheetBody from './spreadsheet-body.vue'

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
```

Next we will extract a component used for the non-editable cells - the row and column labels. Call it `spreadsheet-label-cell`. Update `spreadsheet-body.vue` to use it:

```html
<template>
  <tr v-for="cells in rows">
    <spreadsheet-label-cell :label="cells[0].row" />

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

// ... brevity ...

export default {
  components: {
    SpreadsheetEditableCell,
    SpreadsheetLabelCell,
  },

  // ... brevity ...
}
```

Finally, the implementation of `spreadsheet-label-cell.vue`:

```html
<template>
  <td @click="select">
    <span>
      {{ label }}
    </span>
  </td>
</template>

<script lang="ts">
import { useSheet } from './composables/sheet'

export default {
  props: {
    label: {
      type: String
    }
  },

  setup(props) {
    const { setSelectedCell } = useSheet()

    const select = () => {
      setSelectedCell(parseInt(props.label))
    }

    return {
      select
    }
  }
}
</script>
```

That's it! You can now click a row then click "insert row after" and it will insert a new row. Formulas will recalculate appropriately, as well.

## Conclusion and Improvements

I left a few features out intentionally. As exercises, try adding:

- insert row before (we only covered after, but we defined the `position` which can be either `before` or `after`
- insert a column before/after
- add some tests using Vue Test Utils for the UI layer

You can find the final implementation including the exercises in the [GitHub repository](https://github.com/lmiller1990/spreadsheet).