export interface Cell {
  value: string // a, ct, dog, =SUM()
  type: 'primitive' | 'formula'
}

export interface Sheet {
  cells: Record<string, Cell>
}

export interface UICell {
  value: string
  displayValue?: () => string
  col: string // a, b, c.... z
  row: number // 1 2 3....
}

interface UpdateCell {
  index: string
  value: string
}

export function updateCell(sheet: Sheet, updateCell: UpdateCell) {
  const { index, value } = updateCell
  sheet.cells[index].value = value
}

export function deriveValue(sheet: Sheet, cell: Cell) {
  const [_, args] = cell.value.match(/=SUM\((.*)\)/)
  const cells = args.split(',').map(x => parseInt(
    sheet.cells[x.trim()].value)
  )

  return cells.reduce((acc, curr) => acc + curr, 0).toString()
}

export function displayValueFactory(sheet: Sheet, cell?: Cell) {
  if (!cell) {
    return () => ''
  }

  if (cell.type === 'primitive') {
    return () => cell.value
  }

  if (cell.type === 'formula') {
    return () => deriveValue(sheet, cell)
  }
}

export function render(sheet: Sheet): UICell[][] {
  const rendered: UICell[][] = []
  const { cols, rows } = calcMaxDimensions(sheet)

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []

    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 'a'.charCodeAt(0))
      const idx = `${letter}${j + 1}`
      const cell = sheet.cells[idx]

      row.push({
        value: cell?.value || '',
        col: letter,
        displayValue: displayValueFactory(sheet, cell),
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

export function calcMaxDimensions(sheet: Sheet): Dimensions { 
  const rows: number[] = []
  const cols: string[] = []

  for (const key of Object.keys(sheet.cells)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rows: Math.max(...rows)
  }
}