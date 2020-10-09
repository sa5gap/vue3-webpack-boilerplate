// imports {{{
import { reactive, computed, watch, ref, toRef } from 'vue'
import type { apiData } from './api'
import type { Schema } from './schema'
// }}}

// type declarations {{{
type sortVariant = number | string
type sortColumn = null | string
type sortData = { column: sortColumn; direction: number }
// }}}

// helpers {{{
const sortCompare = (a: sortVariant, b: sortVariant): 1 | -1 | 0 =>
  a > b ? 1 : a < b ? -1 : 0

const str2num = (a: sortVariant): number => {
  if (typeof a == 'string') {
    a = a.replace(',', '')
    a = +a
    if (isNaN(a)) a = 0
  }
  return a
}
// }}}

export default function (data: apiData, load: () => void, schema: Schema) {
  // sort {{{
  let sort: sortData = reactive({
    column: null,
    direction: 0,
  })
  // }}}

  // filters {{{
  let filters = ref<{ [key: string]: string | null }>({})
  watch(
    filters,
    () => {
      data.page = 1
    },
    { deep: true }
  )
  // }}}

  // resources {{{
  let resourceID = toRef(data, 'resourceID')
  watch(resourceID, (v) => {
    filters.value = {}
    schema.current &&
      Object.keys(schema.current).forEach((col) => {
        filters.value[col] = null
      })
  })
  // }}}

  let numPages = ref(0)
  let itemsPerPage = ref(20)

  let table = computed(() => {
    let t = data.table
    const apiPagination = +data.paginationMode == 0

    // processing filters {{{
    Object.keys(filters.value).forEach((col) => {
      let filter = filters.value[col]
      let useApi = schema.current && schema.current[col][2]
      if (filter) {
        console.log('table.filter', col, filter, data.search)
        if (useApi && apiPagination) {
          if (filter !== data.search) {
            data.search = filter
            load()
          }
        } else {
          filter = filter.toUpperCase()
          t = t.filter((row) => {
            return filter && ('' + row[col]).toUpperCase().includes(filter)
          })
        }
      } else if (useApi && data.search && apiPagination) {
        data.search = null
        load()
      }
    })
    // }}}

    // processing sort {{{
    if (sort.column) {
      let col = sort.column
      let type = schema.current && schema.current[col][1]
      console.log('table.sort', sort.column, sort.direction)
      t.sort(
        type === Number
          ? (a, b) => sortCompare(str2num(a[col]), str2num(b[col]))
          : type === Date
          ? (a, b) =>
              sortCompare(
                new Date(a[col]).getTime(),
                new Date(b[col]).getTime()
              )
          : (a, b) => sortCompare(a[col].toUpperCase(), b[col].toUpperCase())
      )
      sort.direction && t.reverse()
    }
    // }}}

    // processing pagination {{{
    let ipp = +itemsPerPage.value
    numPages.value = apiPagination
      ? Math.ceil(data.count / 10)
      : ipp
      ? Math.ceil(t.length / ipp)
      : 1

    if (!apiPagination && ipp > 0) {
      let s = (data.page - 1) * ipp
      t = t.slice(s, s + ipp)
    }
    // }}}

    return t
  })

  function clearFilter(v: string) {
    filters.value[v] = null
  }

  function clearSort() {
    sort.column = null
    sort.direction = 0
  }

  function toggleSort(col: sortColumn) {
    if (col == sort.column) {
      sort.direction = (sort.direction + 1) % 2
    } else {
      sort.column = col
      sort.direction = 0
    }
    console.log('table.toggleSort:', col, sort.direction)
  }

  function goPage(p: number) {
    if (data.page != p) {
      data.page = p
      const apiPagination = +data.paginationMode == 0
      apiPagination && load()
    }
  }

  return {
    table,
    sort,
    filters,
    numPages,
    itemsPerPage,
    goPage,
    clearFilter,
    toggleSort,
    clearSort,
  }
}
