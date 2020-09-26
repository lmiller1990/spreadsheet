import { markRaw, toRaw } from "vue"

type CellType = 'primitive' | 'formula'

export interface Cell {
  value: string // a, ct, dog, =SUM()
  type: CellType
}


type Cells = Record<string, Cell>

export interface Sheet {
  states: Cells[]
}

export interface UICell {
  value: string
  displayValue: () => string
  col: string // a, b, c.... z
  row: number // 1 2 3....
}

export interface UpdateCell {
  value: string
  index: string // a1, b2
}

function inferCellType(cell: UpdateCell): CellType {
  if (cell.value.startsWith('=')) {
    return 'formula'
  }

  return 'primitive'
}

export function updateCell(state: Cells, cell: UpdateCell) {
  state[cell.index].value = cell.value
  state[cell.index].type = inferCellType(cell)
  return state
}

// =SUM(a1, a2)
export function deriveFormula(cells: Cells, cell: Cell) {
  const [_, matches] = cell.value.match(/=SUM\((.*)\)/)
  const numbers = matches.split(',').map(x => parseInt(cells[x.trim()].value))
  return numbers.reduce((acc, curr) => acc + curr, 0).toString()
}

function displayValueFactory(cells: Cells, cell?: Cell): () => string {
  if (!cell) {
    return () => ''
  }

  if (cell.type === 'primitive') {
    return () => cell.value
  }

  if (cell.type === 'formula') {
    return () => deriveFormula(cells, cell)
  }
}

export function render(cells: Cells): UICell[][] {
  const rendered: UICell[][] = []
  const { cols, rows } = calcMaxDimensions(cells)

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []

    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 'a'.charCodeAt(0))
      const idx = `${letter}${j + 1}`
      const cell = cells[idx]

      row.push({
        value: cell?.value || '',
        displayValue: displayValueFactory(cells, cell),
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

export function calcMaxDimensions(cells: Cells): Dimensions { 
  const rows: number[] = []
  const cols: string[] = []

  for (const key of Object.keys(cells)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rows: Math.max(...rows)
  }
}