const API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'trilogy'
const BASE_URL = 'https://www.omdbapi.com/'

export type SearchType = 'movie' | 'series'

export interface SearchItem {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

interface SearchPayload {
  Search?: SearchItem[]
  totalResults?: string
  Response: 'True' | 'False'
  Error?: string
}

export interface Rating {
  Source: string
  Value: string
}

export interface MovieDetails {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Poster: string
  Ratings: Rating[]
  imdbRating: string
  imdbVotes: string
  Type: string
  totalSeasons?: string
  Response: 'True' | 'False'
  Error?: string
}

export interface SearchResult {
  items: SearchItem[]
  total: number
}

async function request<T extends { Response: 'True' | 'False'; Error?: string }>(
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(BASE_URL)
  url.searchParams.set('apikey', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach OMDb. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('OMDb is unavailable right now. Please try again shortly.')
  }

  const data = (await response.json()) as T
  if (data.Response === 'False') {
    const message = data.Error ?? ''
    if (/not found/i.test(message)) {
      throw new Error('No titles matched that search. Try another spelling.')
    }
    if (/invalid api key/i.test(message)) {
      throw new Error('That API key was rejected. Add a valid one to VITE_OMDB_API_KEY.')
    }
    throw new Error(message || 'Something went wrong while talking to OMDb.')
  }

  return data
}

export async function searchMovies(
  query: string,
  type: SearchType | 'all',
  page: number,
): Promise<SearchResult> {
  const params: Record<string, string> = { s: query, page: String(page) }
  if (type !== 'all') params.type = type

  const data = await request<SearchPayload>(params)
  return {
    items: data.Search ?? [],
    total: Number(data.totalResults ?? 0),
  }
}

export async function getMovie(id: string): Promise<MovieDetails> {
  return request<MovieDetails>({ i: id, plot: 'full' })
}
