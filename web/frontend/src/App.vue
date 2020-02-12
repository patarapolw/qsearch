<template lang="pug">
.container(style="padding-top: 1rem; height: 100vh; display: flex; flex-direction: column;")
  b-field
    template(slot="label")
      span Search
      b-tooltip(label="How to search?" position="is-right" type="is-dark")
        a.button.is-white.is-small(
          href="https://github.com/patarapolw/qsearch"
          target="_blank"
        ) &#x2754;
    b-input(v-model="q" placeholder="Please search to view results")
  div(style="flex-grow: 1; position: relative;")
    b-loading(v-if="!output" :is-full-page="false" active)
    b-table(
      v-else
      :data="output"
      paginated
      :per-page="5"
      :total = "count"

      backend-pagination
      @page-change="page = $event"
      backend-sorting
      @sort="onSort"
      :default-sort="[sort, order]"
    )
      template(slot-scope="props")
        b-table-column(label="Unicode" field="codePoint" sortable width="50")
          | {{'U+' + props.row.codePoint.toString(16).toLocaleUpperCase()}}
        b-table-column(label="Symbol" field="symbol" width="100")
          | {{props.row.symbol}}
        b-table-column(label="Code" field="code" sortable width="100")
          code {{props.row.code}}
        b-table-column(label="Alternatives" field="alt" width="100")
          div(v-for="a in props.row.alt" :key="a")
            code {{a}}
        b-table-column(label="Frequency" field="frequency" sortable width="50")
          | {{props.row.frequency ? props.row.frequency.toExponential(3) : ''}}
        b-table-column(label="Description" field="description" sortable) {{props.row.description}}
        b-table-column(label="Hint" field="hint" style="min-width: 200px;")
          div(v-for="a, i in props.row.hint" :key="i") {{a}}
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
  q = ''

  get page () {
    const pageString = Array.isArray(this.$route.query.page) ? this.$route.query.page[0] : this.$route.query.page
    return parseInt(pageString || '1')
  }

  set page (page) {
    if (page === 1) {
      const { page, ...query } = this.$route.query
      this.$router.push({ query })
    } else {
      this.$router.push({
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
    this.$router.push({
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
    this.$router.push({
      query: {
        ...this.$route.query,
        order
      }
    })
  }

  async created () {
    this.q = this.$route.query.q as string || '+type:emoji'
    this.load()
  }

  @Watch('$route.query.q')
  onRouteQChanged () {
    const q = this.$route.query.q
    this.q = (Array.isArray(q) ? q[0] : q) || ''
  }

  @Watch('q')
  @Watch('page')
  @Watch('sort')
  @Watch('order')
  async load () {
    this.$router.push({
      query: {
        ...this.$route.query,
        q: this.q
      }
    })

    try {
      const r = await axios.post(`/api/${this.$route.hash || 'mongo'}`, undefined, {
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
