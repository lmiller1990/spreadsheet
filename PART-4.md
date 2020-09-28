## Implementing Undo and Redo

This is the fourth entry in a series where we build a simple spreadsheet engine, with Vue frontend. In this section, we see how to implement undo/redo, a common feature in almost any application where you enter data. You can find the [source code here](https://github.com/lmiller1990/spreadsheet).

To keep things simple, we will just be adding an "undo" and "redo" button, but you could use a key listener or combo like ctrl+z and ctrl+y if you like.

![](https://raw.githubusercontent.com/lmiller1990/electic/master/screenshots/ss0.png)

Before we jump into that, we will fix a bug; where entering a formula into a cell doesn't update the type from `primitive` to `formula` appropriately.

## Updating the Cell type

Let's fix the bug I mentioned. At the moment, if you have spreadsheet like this:

```ts
const sheet: Sheet = {
  cells: {
    a1: {
      type: 'primitive',
      value: '100'
    },
    a2: {
      type: 'primitive',
      value: '200'
    }
  }
}
```

And update the value of a1 to `=SUM(a2)`, the `type` is not updated, and the cell is interpreted as containing the string literal `=SUM(a2)`, not the derived value.

The current test looks like this:

```js
test('updateCell', () => {
  const sheet = createSheet()
  updateCell(sheet, {
    value: '1000',
    index: 'b1'
  })
  expect(sheet.cells['b1'].value).toBe('1000')
})
```

Let's update it to have add a check for the `type`, too:

```js
test('updateCell', () => {
  const sheet = createSheet()
  updateCell(sheet, {
    value: '=SUM(a1)',
    index: 'b1'
  })
  expect(sheet.cells['b1'].value).toBe('=SUM(a1)')
  expect(sheet.cells['b1'].type).toBe('formula')
})
```

This is failing - update `updateCell`. I am also extracting out a new type, `CellType`, and adding an `inferCellType` function:

```ts
export type CellType = 'primitive' | 'formula'

export interface Cell {
  value: string
  type: CellType
}

// ...

function inferCellType(cell: UpdateCell): CellType {
  if (cell.value.startsWith('=')) {
    return 'formula'
  }

  return 'primitive'
}

export function updateCell(sheet: Sheet, cell: UpdateCell) {
  sheet.cells[cell.index].value = cell.value
  sheet.cells[cell.index].type = inferCellType(cell)
}
```

Great; bug fixed! Let's get onto undo/redo.

## The Data Structure

There are *many* ways to handle undo/redo. We will start with something simple, that is only really limited in terms of memory (this is not memory efficient; but we can easily optimize it, if we need it).

Let's say you have the following spreadsheet:

```sh
+-----+-----+-----+
|     |  a  |  b  |
+-----+-----+-----+
|  1  | 100 | 200 |
+-----+-----+-----+
```

And you change b1 to 500:

```
+-----+-----+-----+
|     |  a  |  b  |
+-----+-----+-----+
|  1  | 100 | 500 |
+-----+-----+-----+
```

We could attempt to keep track of the changes, something like this:

```js
{
  "history": [
    {
      cell: 'a1',
      value: '200'
    }
  ]
}
```

Then when we hit "redo", we could just find the cell, figure out what needs to change, and make the change. This would (probably) work, but it already seems complex - we need to keep track of a lot of things. What if eventually have a feature to update many cells at once? Do we then need a nested array for history, to support "bulk" edits?

I will propose a *much* more simple method - instead of keeping track of things on a cell by cell level, every time something changes, I am just going to keep the entire spreadsheet as the previous state, and consider the new one at the latest state.

This was, when we either hit undo or redo, we just update the entire spreadsheet with the previous state - no keeping track of specific cell by cell changes.

The perfect data structure for this is a *stack*. A stack is a last in, first out data structure. For example if we have a history of numbers:

```
numbers = [1, 2, 3]
```

And we update the second index to be 100:

```
numbers = [1, 100, 2]
```

We just push a new entry onto the history array:

```
// initial state
numbersHistory = [
  [1, 2, 3]
]

// change 2 to 100, now we have another entry on the end:

numbersHistory = [
  [1, 2, 3],
  [1, 100, 3],
]
```

The current state of the array would be the final entry:  `numbersHistory[numbersHistry.length - 1]`. To implement undo, we just set the `numbers` to equal to `numbersHistory[numbersHistry.length - 2]`. Redo, we just go to the next entry in the array (unless you are at the final one, you cannot "redo" anymore. Same goes for undo - you cannot undo past the initial entry").

Clearly this is not very efficient - we need to store many copies of the spreadsheet. There are some optimizations we can make, but for now let's implement it and come back to those later, if we feel the need to do so.

## Updating the Sheet interface

We need to start at the core of our engine - the `Sheet` interface. Currently it is:

```ts
export interface Sheet { 
  cells: Record<string, Cell>
}
```

We need to transition this to a stack like data structure - we can do this using an array.

```ts
type Cells = Record<string, Cell> 

export interface Sheet { 
  states: Cells[]
}
```

With this change, a lot of things break - makes sense, we changed the core interface. Let's fix everything, starting with `updateCell`. Instead of passing an entire sheet, we will now just pass a single state (the current one, which will be the last entry in the `states` array):

```ts
export function updateCell(state: Cells, cell: UpdateCell) {
  state[cell.index].value = cell.value
  state[cell.index].type = inferCellType(cell)
}
```

Hardly anything has changed - the ideas of and motivation behind the function is the same.

Next, `render` and `calcMaxDimensions`:

```ts
export function render(state: State): UICell[][] {
  const rendered: UICell[][] = []
  const { cols, rows } = calcMaxDimensions(state)

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []

    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 'a'.charCodeAt(0))
      const idx = `${letter}${j + 1}`
      const cell = state[idx]

      row.push({
        value: cell?.value || '',
        displayValue: displayValueFactory(state, cell),
        col: letter,
        row: j + 1
      })
    }
    rendered.push(row)
  }

  return rendered
}

export interface Dimensions {
  cols: number
  rows: number
}

export function calcMaxDimensions(state: Cells): Dimensions { 
  const rows: number[] = []
  const cols: string[] = []

  for (const key of Object.keys(state)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rows: Math.max(...rows)
  }
}
```

Again, the ideas are the same - just a slightly different interface.

Finally, `deriveFormula` and `displayValueFactory`:

```ts
export function deriveFormula(state: Cells, cell: Cell) {
  const [_, matches] = cell.value.match(/=SUM\((.*)\)/)
  const numbers = matches.split(',').map(x => parseInt(state[x.trim()].value))
  return numbers.reduce((acc, curr) => acc + curr, 0).toString()
}

function displayValueFactory(state: Cells, cell?: Cell): () => string {
  if (!cell) {
    return () => ''
  }

  if (cell.type === 'primitive') {
    return () => cell.value
  }

  if (cell.type === 'formula') {
    return () => deriveFormula(state, cell)
  }
}

```

Finally, we need to update the tests. The updated tests:

```ts
import { Dimensions, calcMaxDimensions, Cell, Sheet, render, UICell, updateCell, deriveFormula } from './spreadsheet'

const createSheet = (): Sheet => ({
  states: [
    {
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
        value: '=SUM(a1, a2)',
        type: 'formula'
      },
    }
  ]
})

test('deriveFormula', () => {
  const sheet = createSheet()
  const actual = deriveFormula(sheet, sheet.states[0]['b2'])
  expect(actual).toBe('300')
})

test('updateCell', () => {
  const sheet = createSheet()
  updateCell(sheet, {
    value: '=SUM(a1)',
    index: 'b1'
  })
  expect(sheet.states[0]['b1'].value).toBe('=SUM(a1)')
  expect(sheet.states[0]['b1'].type).toBe('formula')
})

describe('calcMaxDimensions', () => {
  it('calcualtion dimensions', () => {
    const sheet = createSheet()
    const actual = calcMaxDimensions(sheet)
    const expected: Dimensions = {
      cols: 2,
      rows: 2
    }

    expect(actual).toEqual(expected)
  })
})

describe('render', () => {
  it('transforms into a ui rep', () => {
    const sheet = createSheet()
    const actual = render(sheet).map(row => {
      return row.map(cell => {
        const { displayValue, ...rest } = cell
        return rest
      })
    })

    const expected = [
      [{ row: 1, col: 'a', value: '100' }, { row: 1, col: 'b', value: '300' }],
      [{ row: 2, col: 'a', value: '200' }, { row: 2, col: 'b', value: '=SUM(a1, a2)' }]
    ]

    expect(actual).toEqual(expected)
  })
})
```

Phew. All the tests are passing. Lastly, update `setup` in `app.vue`:

```ts
setup() {
  const { sheet } = useSheet()
  return {
    sheet: computed(() => render(sheet.states[0]))
  }
}
```

and `handleUpdate` in `spreadsheet-editable-cell.vue`:

```ts
const handleUpdate = (evt: any) => {
  updateCell(sheet.states[0], {
    index: `${props.cell.col}${props.cell.row}`,
    value: evt.target.value
  })
}
```

...and `composables/sheet.ts`:

```ts
const sheet: Sheet = reactive<Sheet>({
  states: [
    {
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
        value: '=SUM(a1, a2)',
        type: 'formula'
      },
    }
  ]
})
```

*Finally* everything is working again. While this was a lot of work, we by putting thought into how we want to handle undo/redo, the actual implementation is trivial. 

## Tracking the Current State

You may have notice we hard-coded the current state to use - `sheet.states[0]` is everywhere. We need some way to track the *current* state. I have decided *not* to track this in the engine, but leave it to the UI implementation to track. I will do this in my `useSheet` composable. Update `composables/sheet.ts`:

```ts
import { reactive, ref } from 'vue'

// ...

const currentStateIndex = ref(0)

export function useSheet() {
  return {
    sheet,
    currentStateIndex
  }
}
```

## Immutability is Key

We are almost done! I'd like to make one small change to the way `updateCell` works, though. Let's review `updateCell`

```ts
export function updateCell(state: Cells, cell: UpdateCell) {
  state[cell.index].value = cell.value
  state[cell.index].type = inferCellType(cell)
}
```

We pass in a reference to a state, and *mutate* it. This could be confusing and lead to bugs:

```ts
const sheet: Sheet = { /* ... */ }
updateCell(sheet.states[0], { index: 'a1', value: '100' }
sheet.states[0].a1 // => 100
```

It's obvious in this trivial example, but in a large code base, maybe not. Instead, we are going to write this in a more functional style. Instead of mutating, we will return the new state.

```ts
export function updateCell(state: Cells, cell: UpdateCell): Cells {
  const newState = JSON.parse(JSON.stringify(state))
  newState[cell.index].value = cell.value
  newState[cell.index].type = inferCellType(cell)
  return newState
}
```

`JSON.parse/JSON.stringify` is known to not be super performant, not ideal (eg, it won't work on data structures with things like `new Date()` in them) but it's fine for this simple example - we are only working with strings, and a relatively small JSON data structure.  Even if the spreadsheet was very large, I don't see this becoming a problem until we have something in the area of 100k cells.

I am using it here to clone the state that passed in - so if we pass a `reactive` object, we can lose the reference, since JavaScript objects are pass by reference, not value. 

## Moving `update` into the composable

Let's extract the complexity out of `spreadsheet-editable-cell.vue` into the composable now, too. This new function, `update`, will handle creating a new state and appending to the spreadsheet:

```ts
// ...

const currentStateIndex = ref(0)

function update(index: string, value: string) {
  const newState = updateCell(sheet.states[currentStateIndex.value], {
    index,
    value
  })
  sheet.states.push(newState)
  currentStateIndex.value += 1
}

export function useSheet() {
  return {
    sheet,
    currentStateIndex,
    update
  }
}
```

Update `spreadsheet-editable-cell.vue` to use the new `update` function:

```ts
setup(props, { emit }) {
  const cellRef = ref(null)
  const { update } = useSheet()
  const handleUpdate = (evt: any) => {
    update(
      `${props.cell.col}${props.cell.row}`,
      evt.target.value
    )
  }

  // ...

}
```

## Undo and Redo

Finally, it's time to actually implement undo/redo. Thanks to our planning, and focus on the engine (where all the logic actually lives), it's only a few lines of code:

```html
<template>
  <button @click="undo">Undo</button>
  <button @click="redo">Redo</button>
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
    const { sheet, currentStateIndex } = useSheet()
    return {
      undo: () => currentStateIndex.value -= 1,
      redo: () => currentStateIndex.value += 1, 
      sheet: computed(() => render(sheet.states[currentStateIndex.value])),
      states: computed(() => sheet.states.map(state => render(state))) 
    }
  }
}
</script>
```

It works! 

![](https://raw.githubusercontent.com/lmiller1990/electic/master/screenshots/ss0.png)

I also updated the `<pre>` tag to loop over all the states, to show how things are changing. 

## Conclusion and Improvements

A more robust solution would prevent the undo/redo buttons from been clicked if there was no previous or next state. We could also consider more optimal ways of saving edit history; the easiest solution would just be to have a limit of 15 undos - this is common in a lot of large systems for this exact reason.

We saw how separating our concerns as much as possible made things easy to implement; the actual code in the UI layer was only around 5 lines! Updating the `updateCell` function return the next state was also a big improvement; this makes our application less likely to have bugs, since we are avoiding side effects.
