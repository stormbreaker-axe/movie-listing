import { useEffect, useState } from 'react'
import { searchMovies, type SearchItem, type SearchType } from './api'
import MovieCard from './components/MovieCard'
import MovieModal from './components/MovieModal'

type Filter = SearchType | 'all'
type Status = 'idle' | 'loading' | 'ready' | 'error'

const SUGGESTIONS = ['Dune', 'Spirited Away', 'The Bear', 'Blade Runner 2049', 'Parasite', 'Heat']

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
]

export default function App() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<SearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [moreLoading, setMoreLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!query) {
      setItems([])
      setTotal(0)
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(null)
    setItems([])
    setTotal(0)
    setPage(1)

    searchMovies(query, type, 1)
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotal(result.total)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [query, type])

  function runSearch(value: string) {
    const trimmed = value.trim()
    setInput(trimmed)
    setQuery(trimmed)
  }

  async function loadMore() {
    const nextPage = page + 1
    setMoreLoading(true)
    try {
      const result = await searchMovies(query, type, nextPage)
      setItems((current) => {
        const seen = new Set(current.map((item) => item.imdbID))
        return [...current, ...result.items.filter((item) => !seen.has(item.imdbID))]
      })
      setPage(nextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setMoreLoading(false)
    }
  }

  const hasMore = items.length > 0 && items.length < total && page < 10

  return (
    <div className="page">
      <header className="header">
        <div className="wordmark">
          <span className="wordmark-dot" aria-hidden="true" />
          Reel
        </div>
        <p className="tagline">A simple movie library — search films and series by title.</p>
      </header>

      <main>
        <form
          className="search"
          onSubmit={(event) => {
            event.preventDefault()
            runSearch(input)
          }}
        >
          <div className="search-field">
            <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5 18 18" />
            </svg>
            <input
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search a movie or series…"
              aria-label="Search a movie or series"
              autoFocus
            />
          </div>

          <div className="filters" role="group" aria-label="Filter by type">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={filter.value === type ? 'filter is-active' : 'filter'}
                aria-pressed={filter.value === type}
                onClick={() => setType(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {status === 'idle' && (
          <section className="empty">
            <p className="empty-title">Start with a title</p>
            <p className="muted">Try one of these:</p>
            <div className="suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="suggestion"
                  onClick={() => runSearch(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
        )}

        {status === 'loading' && (
          <div className="grid" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="card card-skeleton">
                <div className="skeleton skeleton-poster" />
                <div className="card-body">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line skeleton-line-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <section className="empty">
            <p className="empty-title">Nothing to show</p>
            <p className="muted">{error}</p>
            <button type="button" className="ghost-button" onClick={() => runSearch(query)}>
              Try again
            </button>
          </section>
        )}

        {status === 'ready' && (
          <>
            <p className="result-meta">
              {total} {total === 1 ? 'result' : 'results'} for <strong>“{query}”</strong>
            </p>

            <div className="grid">
              {items.map((item) => (
                <MovieCard key={item.imdbID} item={item} onSelect={setSelected} />
              ))}
            </div>

            {error && <p className="inline-error">{error}</p>}

            {hasMore && (
              <div className="load-more">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={loadMore}
                  disabled={moreLoading}
                >
                  {moreLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        Data from the{' '}
        <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
          OMDb API
        </a>
        . Ratings and posters belong to their respective owners.
      </footer>

      {selected && <MovieModal imdbID={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
