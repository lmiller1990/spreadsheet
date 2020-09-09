Over the next few blog articles, I will build a mini spreadsheet clone (like Excel). The goal isn't really to build a spreadsheet, but to show how thinking about data structures and how to represent concepts will help you separate your business logic and your UI layer. 

This has many benefits:

- testability
- reveals bad decision decisions early
- performance (the wrong data structure can cost you; excessive loops, unnecessary re-renders)

I am still not sure on the ideal way to design a spreadsheet engine. Any feedback is always welcome.

You can find the [completed source code here](https://github.com/lmiller1990/spreadsheet).

## Modular Thinking

So we are building a spreadsheet application; obviously we will need a UI, so people can interact with it; but the spreadsheet engine should be capable of doing everything without actually *needing* a UI. For example, you should also be able to use it from a terminal, if you really wanted.

So we are actually building two things:

- a spreadsheet engine
- a spreadsheet UI

The engine will store the state of each cell, and any other relevant information. The UI will just present the state to the user, and let them interact with it. If you are reading this blog, you are likely a developer, not a designer, so you want to focus on building the engine in such a manner it can be applied to any UI the designer comes up with.

## Design Decisions

While designers are constantly coming up with new ideas and concepts, there are some assumptions we can make about a spreadsheet, and we will have some self imposed constraints for the sake of this simple example.

- the spreadsheet will only be 2 dimensional (rows and columns).
- we will only support two cell types: `primitive`, which is just a number or string value, and `formula`, which is something like `=SUM(a1, a2, a3)`.

## Writing Some Basic Interfaces

I hae decided I am going to keep track of my cells in the same manner as they are going to appear in the UI; rows as numbers, columns as letters. I am also going to limit the spreadsheet to 26 columns: A - Z. I will, however, design things in such a manner that they can be extended to have more columns if needed.

With this in mind, I defined 3 interfaces. 

```ts
export interface Cell {
  value: string
  type: 'primitive' | 'formula'
}

export interface Sheet {
  cells: Record<string, Cell>
}
```

I defined these in a file called `spreadsheet.ts`.

I think `Cell` is relatively straight forward. `Sheet` is too, kind of, except I am using a `Record` instead of a multidimensional array, like you might have expected.

The main reason I did this is when you use a spreadsheet, you are often looking up specific cells - much more often than you are iterating over them all.

I am also going to use the same format users do as the key; A1, B4 etc. So a simple spreadsheet would be represented like this:

```ts
const sheet: Sheet = {
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
      value: '=SUM(a1, a2)',
      type: 'formula',
    }
  }
}
```

## Rendering the Spreadsheet 

Although I like to use Vue to build my UIs, I would like to make this spreadsheet engine framework agnostic; that means we should be able to transform the `Record<string, cell>` data structure into something any framework can easily render. I think the easiest way to do this will be a multi dimensional array. For example this would be very easy to render:

```ts
const rendered: string[][] = 
[
  ['1', '2'],
  ['3', '4']
]
```

You would just need to `for` loops, or `v-for` in the case of Vue. Something like this (note, the real implementation will be a little more involved).

```html
<table>
  <tr v-for="row in rendered">
    <td v-for="cell in row">
      {{ cell }}
    </td>
  </tr>
</table>
```

One of the downsides to using a `Record` to store the cells if there is no easy way to know how many roles and columns are actually in the spreadsheet. You don't actually need to know how many rows/columns are needed until you render the UI, though, os I think using a `Record` to store the cells is still a good choice. Intuitively, the below spreadsheet has 2 rows and 1 column:

```ts
const sheet = {
  cells: {
    'a1': { value: 'dog' },
    'a2': { value: 'cat' }
  }
}

/* 
  looks like this:
     +--------+
     |   a    |
+----|--------+
| 1  | 'dog'  |
+----+--------+
| 2  | 'cat'  |
+----+--------+

*/
```

## Writing the render test

Now we know what we want to achieve with the `render` function, let's write a test. I think it's useful to include `value`, `col` and `row` in the rendered output. I wrote the following test in a `spreadsheet.spec.ts` and ran it with Jest and the `ts-jest` preset. I also added a `UICell` interface to my `spreadsheet.ts` file:

```ts
export interface UICell {
  value: string
  row: number
  col: string
}
```

The test is as follows:

```ts
import { Sheet, UICell } from './spreadsheet'

describe('render', () => {
  test('transforms into a multidimensions array suitable for looping', () => {
    const sheet: Sheet = {
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
    }

    const expected: UICell[][] = [
      [{ value: '1', col: 'a', row: 1 }, { value: '3', col: 'b', row: 1 }],
      [{ value: '2', col: 'a', row: 2 }, { value: '4', col: 'b', row: 2 }],
    ]

    expect(render(sheet)).toEqual(expected)
  })
})
```

## Figuring out the Dimensions

We need to know the number of rows and columns before we start writing `render`. Those need to be derived from the cells. We have `a1, b1, a2, b2` so we know it's going to be  2 x 2. Let's write a test for a new function called `calcMaxDimensions`:

```ts
describe('calcDimensions', () => {
  it('works for many cells', () => {
    const cell = (): Cell => ({
      type: 'primitive',
      value: ''
    })

    expect(calcMaxDimensions({
      cells: {
        'a1': cell(),
        'b1': cell(),
        'c1': cell(),
        'a2': cell(),
        'b2': cell(),
        'c2': cell()
      }
    })).toEqual({ rows: 2, cols: 3 })
  })
})
```

The implementation is a little complex. It's also not THAT efficient. We only need to call this function when the number of rows/columns changes, though, which isn't that often. I'll show the code then explain a little - best watch the screencast for a more extensive explanation.

```ts
export function calcMaxDimensions(sheet: Sheet): Dimensions {
  const rows: number[] = []
  const cols: string[] = []
  
  for (const key of Object.keys(sheet.cells)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    rows: Math.max(...rows),
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1
  }
}
```

The main points:
- we use a regexp to figure out the column and row for each cell as we iterate over the keys of `sheet.cells`, which is `a1`, `b2` etc.
- `const [_, col, row] = key.match(/(\w.*?)(\d.*)/)` will give us `col = 'a', row = '2'` etc.
- keep the row and col for later. We want to find the largest one for each, that will tell us the dimensions of the spreadsheet
- figure out the rows by getting the maximum number in rows - this is easy because rows are already numbers
- the column count is more tricky. `a` = 1 column, `z` = 26. We are only allowing 26 columns for simplicity, but allowing for more wouldn't be hard
- sort the columns then reverse it. Grab the first element to get the largest (where`z` is the largest possible value in our spreadsheet)
- use `charCodeAt` to get the character code. These are ASCII codes. 'a'` is 97. So we subtract 97 ('a'.charCodeAt(0)`) to offset it, then add 1

The test now passes. Implementing the rest of `render` is trivial now:

```ts
export function render(sheet: Sheet): UICell[][] {
  const { rows, cols } = calcMaxDimensions(sheet)
  const rendered: UICell[][] = []

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []
    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 97)
      const index = `${letter}${j + 1}`
      row.push({ 
        row: j + 1,
        col: letter,
        value: sheet.cells[index].value
      })
    }
    rendered.push(row)
  }

  return rendered
}
```

Great! We now have a (very) basic spreadsheet engine. We don't support formulas, yet, or have any way to update the spreadsheet. We will cover this in the next blog post, where we use Vue and Vite to create a simple UI. We also touch on the fact that spreadsheets are modal editors, like Vim, and how this impacts how we build the UI.
