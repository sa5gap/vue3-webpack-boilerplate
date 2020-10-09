import { reactive, computed } from 'vue'
import type { Resources, ResourceRecord } from '../schema'
import type { apiData } from './api'

type Schema = {
  all: Resources
  current: ResourceRecord | null
}

export default function (resources: Resources, data: apiData) {
  let schema: Schema = reactive({
    all: resources,
    current: computed(() =>
      data.resourceID && resources[data.resourceID]
        ? resources[data.resourceID]
        : null
    ),
  })

  return { schema }
}

export type { Schema }
