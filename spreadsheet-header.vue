<template>
  <tr>
    <td></td>
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
  methods: {
    toAlpha(i: number) {
      return String.fromCharCode(i + 96)
    }
  }
}
</script>