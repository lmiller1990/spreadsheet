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