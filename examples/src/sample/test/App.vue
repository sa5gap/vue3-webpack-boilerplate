<template lang="pug">
  header
    h1 {{data.resourceID}} ({{ data.ready ? data.count : 'Loading...' }})
    aside
      template(v-for="v, k in schema.all")
        a(href="#" @click.prevent="onSelectResource(k)") {{ k }}
  
  table
    tr.header
      template(v-for="k, v in schema.current" :key="v") 
        th(
          @click="onSortColumn(v)" 
          :class="getColumnClass(v)") {{ k[0] }}

    tr.filter
      td(v-for="k, v in schema.current" :key="v") 
        div
          span
            input(
              type="text" 
              placeholder="Filter"
              :disabled="!data.ready" 
              v-model="filters[v]")
          span.clear(@click="onClearFilter(v)")

    tbody(v-if="data.ready")
      tr(v-for="row, i in table") 
        td(v-for="v, k in schema.current") {{ row[k] }}

  footer
    .count Found: {{ table.length }} of {{ data.count }}
    .pages Pages: 
      template(v-for="i in numPages")
        u(@click="goPage(i)" :class="{selected: i==data.page}") {{ i }}
    .mode Mode: 
      select(v-model.number="data.paginationMode")
        option(value="0") API
        option(value="1") Client
      template(v-if="data.paginationMode==1")
        select(v-model.number="itemsPerPage")
          option(value="0") all
          option 5
          option 10
          option 20
          option 30

</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import useApi from './modules/api'
  import useSchema from './modules/schema'
  import useTable from './modules/table'
  import { url, resourceID, resources } from './schema'

  export default defineComponent({
    setup(props) {
      let { data, load, setResource, clearParams } = useApi(url)
      let { schema } = useSchema(resources, data)
      let {
        table,
        sort,
        filters,
        numPages,
        itemsPerPage,
        goPage,
        clearFilter,
        toggleSort,
        clearSort,
      } = useTable(data, load, schema)

      setResource(resourceID)
      load()

      return {
        data,
        load,
        schema,
        table,
        sort,
        filters,
        numPages,
        itemsPerPage,
        goPage,
        setResource,
        clearParams,
        toggleSort,
        clearSort,
        clearFilter,
      }
    },

    methods: {
      onSelectResource(resID: string) {
        if (this.data.resourceID != resID) {
          this.setResource(resID)
          this.clearParams()
          this.clearSort()
          this.load()
        }
      },

      onSortColumn(col: string) {
        this.toggleSort(col)
      },

      onClearFilter(f: string) {
        this.clearFilter(f)
      },

      getColumnClass(col: string) {
        return (
          col === this.sort.column && (this.sort.direction ? 'desc' : 'asc')
        )
      },
    },
  })
</script>

<style lang="scss">
  body {
    padding: 2rem;
  }

  header {
    display: flex;
    align-items: center;
    text-transform: capitalize;

    h1 {
      flex-grow: 1;
    }

    aside a {
      display: inline-block;
      margin-left: 1rem;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;

    td,
    th {
      padding: 2px 0;
    }

    td {
      border-bottom: 1px solid #ccc;
    }

    th {
      text-align: left;
      &.asc,
      &.desc {
        color: blue;
        &::after {
          margin-left: 0.25rem;
        }
      }
      &.asc::after {
        content: '\25BE';
      }
      &.desc::after {
        content: '\25B4';
      }
    }

    tr.filter {
      .clear::before {
        content: '\2715';
        padding: 0 6px;
        color: red;
        cursor: pointer;
      }
      td {
        border: 0;
      }
      td > div {
        display: flex;
        align-items: center;
        input {
          width: 100%;
          max-width: none;
          box-sizing: border-box;
          padding: 0px;
        }
        > :first-child {
          flex: 1 0;
        }
      }
    }
  }

  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
    > span {
      padding-right: 15px;
    }
    .pages u {
      display: inline-block;
      margin-left: 2px;
      background: #eee;
      width: 1.7rem;
      height: 1.7rem;
      line-height: 1.7rem;
      text-align: center;
      text-decoration: none;
      border-radius: 50%;
      cursor: pointer;
      &.selected {
        background: blue;
        color: #fff;
      }
    }
    select {
      box-sizing: border-box;
      border: 1px solid #ccc;
      padding: 2px 5px;
      background: transparent;
    }
  }
</style>
