<template lang="pug">
section
  b-tabs(v-model="tabIndex" type="is-boxed" style="margin: 1rem; margin-bottom: 0;")
    b-tab-item(label="MongoDB")
    b-tab-item(label="LokiJS")
    b-tab-item(label="NeDB") 
  .container(style="margin-top: min-height: 80vh; display: flex; flex-direction: column;")
    b-field
      template(slot="label")
        span Search with {{mode}}
        b-tooltip(label="How to search?" position="is-right" type="is-dark")
          a.button.is-white.is-small(
            href="https://github.com/patarapolw/qsearch"
            target="_blank"
          ) &#x2754;
      b-input(v-model="q" placeholder="Please search to view results")
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

@Component
export default class App extends Vue {
  output: any[] | null = null
  count = 0

  readonly tabArray = ['mongodb', 'lokijs', 'nedb']

  readonly columns = [
    { field: 'frequency', label: 'frequency', numeric: true, width: 100 },
    { field: 'name', label: 'name', width: 250 },
    { field: 'description', label: 'description' },
    { field: 'isCool', label: 'isCool', width: 100 },
    { field: 'date', label: 'date', width: 200 },
    { field: 'data.a', label: 'data.a', width: 250 },
    { field: 'data.b', label: 'data.b', width: 250 }
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
    return this.$route.hash.substr(1) || this.tabArray[0]
  }

  get tabIndex () {
    const i = this.tabArray.indexOf(this.mode)
    return i === -1 ? 0 : i
  }

  set tabIndex (i) {
    console.log(i)

    this.$router.replace({
      ...this.$route,
      hash: this.tabArray[i]
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
    return this.$route.query.sort || 'frequency'
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
    return this.$route.query.order || 'desc'
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
    this.load()
  }

  @Watch('$route.hash')
  @Watch('q')
  @Watch('page')
  @Watch('sort')
  @Watch('order')
  async load () {
    try {
      const r = await axios.get(`/api/${this.mode}`, {
        params: {
          q: this.q,
          offset: (this.page - 1) * 5,
          sort: this.sort,
          order: this.order
        }
      })

      this.count = r.data.count
      Vue.set(this, 'output', r.data.data)
    } catch (e) {
      Vue.set(this, 'output', [])
    }
  }

  onSort (sort: string, order: string) {
    this.sort = sort
    this.order = order
  }
}
</script>
