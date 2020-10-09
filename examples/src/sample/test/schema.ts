type ResourceRecord = { [resourceCol: string]: [string, Object, boolean?] }
type Resources = { [resourceID: string]: ResourceRecord }

const url: string = 'https://swapi.dev/api/'

const resourceID: string = 'films'

const resources: Resources = {
  films: {
    title: ['Title', String, true],
    release_date: ['Date', Date],
    episode_id: ['Episode', Number],
  },
  people: {
    name: ['Name', String, true],
    gender: ['Gender', String],
    height: ['Height', Number],
    mass: ['Mass', Number],
    eye_color: ['Eye', String],
  },
}

export type { Resources, ResourceRecord }
export { url, resourceID, resources }
