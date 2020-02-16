<template lang="pug">
section
  .tabs.is-boxed(style="margin: 1rem;")
    ul(style="flex-grow: 0;")
      li(:class="mode === 'MongoDB' ? 'is-active' : ''")
        a(@click="mode = 'MongoDB'") MongoDB
    ul(style="flex-grow: 0;")
      li(:class="mode === 'LokiJS' ? 'is-active' : ''")
        a(@click="mode = 'LokiJS'") LokiJS
    ul(style="flex-grow: 0;")
      li(:class="mode === 'NeDB' ? 'is-active' : ''")
        a(@click="mode = 'NeDB'") NeDB
    ul(style="flex-grow: 0;")
      li(:class="mode === 'Native' ? 'is-active' : ''")
        a(@click="mode = 'Native'") Native
    ul(style="flex-grow: 0;")
      li(:class="mode === 'LiteORM' ? 'is-active' : ''")
        a(@click="mode = 'LiteORM'") LiteORM
    ul(style="flex-grow: 1;")
    ul(style="flex-grow: 0;")
      a(href="https://github.com/patarapolw/qsearch" target="_blank")
        b-icon(icon="github-circle")
  .container(style="margin-top: min-height: 80vh; display: flex; flex-direction: column;")
    b-field
      template(slot="label")
        span Search with {{mode}}
        b-tooltip(label="How to search?" position="is-right" type="is-dark")
          a.button.is-white.is-small(
            href="https://github.com/patarapolw/qsearch"
            target="_blank"
          ) &#x2753;
      b-input(
        v-model="q" placeholder="Please search to view results" type="search"
        spellcheck="false" autocomplete="off"
      )
    div(style="flex-grow: 1; position: relative;")
      b-loading(v-if="!output" active)
      b-table(
        v-else
        :data="output"
        paginated
        :per-page="5"
        :total = "count"
        :columns="columns"

        backend-pagination
        @page-change="page = $event"
        backend-sorting
        @sort="onSort"
        :default-sort="[sort, order]"
      )
        template(slot="empty")
          section.section
            .content.has-text-grey.has-text-centered
              p
                b-icon(icon="emoticon-sad" size="is-large")
              p Nothing here.
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import axios from 'axios'
import dayjs from 'dayjs'

@Component
export default class App extends Vue {
  output: any[] | null = null
  count = 0

  readonly columns = [
    { field: 'frequency', label: 'frequency', numeric: true, width: 100, sortable: true },
    { field: 'name', label: 'name', width: 150, sortable: true },
    { field: 'description', label: 'description', sortable: true },
    { field: 'isCool', label: 'isCool', width: 100, sortable: true },
    { field: 'date', label: 'date', width: 250, sortable: true },
    { field: 'data.a', label: 'data.a', width: 150, sortable: true },
    { field: 'data.b', label: 'data.b', width: 150, sortable: true }
  ]

  get q () {
    return this.$route.query.q
  }

  set q (q) {
    this.$router.replace({
      ...this.$route,
      query: {
        ...this.$route.query,
        q
      }
    })
  }

  get mode () {
    return this.$route.path.substr(1) || 'MongoDB'
  }
  
  set mode (m) {
    this.$router.replace({
      ...this.$route,
      path: `/${m}`
    })
  }

  get page () {
    const pageString = Array.isArray(this.$route.query.page) ? this.$route.query.page[0] : this.$route.query.page
    return parseInt(pageString || '1')
  }

  set page (page) {
    if (page === 1) {
      const { page, ...query } = this.$route.query
      this.$router.replace({
        ...this.$route,
        query
      })
    } else {
      this.$router.replace({
        ...this.$route,
        query: {
          ...this.$route.query,
          page: page.toString()
        }
      })
    }
  }

  get sort () {
    return this.$route.query.sort || 'name'
  }

  set sort (sort) {
    this.$router.replace({
      ...this.$route,
      query: {
        ...this.$route.query,
        sort
      }
    })
  }

  get order () {
    return this.$route.query.order || 'asc'
  }

  set order (order) {
    this.$router.replace({
      ...this.$route,
      query: {
        ...this.$route.query,
        order
      }
    })
  }

  async created () {
    if (!this.$route.query.q) {
      this.$router.push({
        ...this.$route,
        query: {
          ...this.$route.query,
          q: '-name:NULL'
        }
      })
    }

    this.load()
  }

  @Watch('$route.path')
  @Watch('q')
  @Watch('page')
  @Watch('sort')
  @Watch('order')
  async load () {
    try {
      const r = await axios.get(`/api/${this.mode.toLocaleLowerCase()}`, {
        params: {
          q: this.q,
          offset: (this.page - 1) * 5,
          sort: this.sort,
          order: this.order
        }
      })

      this.count = r.data.count
      Vue.set(this, 'output', r.data.data.map((el: any) => {
        return Object.entries<any>(el)
          .map(([k, v]) => [k, k === 'date' ? dayjs(v).format('YYYY-MM-DD HH:mm Z') : v])
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v}), {})
      }))

      console.info(r.data)
    } catch (e) {
      console.error(e)
      Vue.set(this, 'output', [])
    }
  }

  onSort (sort: string, order: string) {
    this.sort = sort
    this.order = order
  }
}
</script>
