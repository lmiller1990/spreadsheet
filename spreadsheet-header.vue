<template>
  <tr>
    <td />
    <td v-for="i in colCount">
      {{ toAlpha(i) }}
    </td>
  </tr>
</template>

<script lang="ts">
export default {
  props: {
    colCount: {
      type: Number
    }
  },

  setup() {
    const toAlpha = (num: number) => {
      // a -> 97
      return String.fromCharCode(num + 96)
    }

    return {
      toAlpha
    }
  }
}
</script>