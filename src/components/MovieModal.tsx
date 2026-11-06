import { useEffect, useState } from 'react'
import { getMovie, type MovieDetails } from '../api'

interface Props {
  imdbID: string
  onClose: () => void
}

function Stat({ label, value }: { label: string; value: string }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function MovieModal({ imdbID, onClose }: Props) {
  const [details, setDetails] = useState<MovieDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [posterFailed, setPosterFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDetails(null)
    setPosterFailed(false)

    getMovie(imdbID)
      .then((data) => {
        if (!cancelled) setDetails(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this title.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [imdbID])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const hasPoster = details && details.Poster !== 'N/A' && !posterFailed
  const ratings = details?.Ratings?.filter((rating) => rating.Value && rating.Value !== 'N/A') ?? []

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={details?.Title ?? 'Title details'}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading && (
          <div className="modal-loading" aria-live="polite">
            <div className="skeleton skeleton-poster" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line skeleton-line-lg" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-sm" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="modal-message">
            <p className="modal-message-title">Couldn’t load details</p>
            <p className="muted">{error}</p>
          </div>
        )}

        {!loading && details && (
          <div className="modal-content">
            <div className="modal-poster">
              {hasPoster ? (
                <img
                  src={details.Poster}
                  alt={`${details.Title} poster`}
                  onError={() => setPosterFailed(true)}
                />
              ) : (
                <span className="card-poster-fallback" aria-hidden="true">
                  {details.Title.slice(0, 1)}
                </span>
              )}
            </div>

            <div className="modal-info">
              <p className="eyebrow">
                {details.Type}
                {details.Year !== 'N/A' && <span> · {details.Year}</span>}
              </p>
              <h2 className="modal-title">{details.Title}</h2>

              <div className="chips">
                {details.Rated !== 'N/A' && <span className="chip">{details.Rated}</span>}
                {details.Runtime !== 'N/A' && <span className="chip">{details.Runtime}</span>}
                {details.imdbRating !== 'N/A' && (
                  <span className="chip chip-rating">★ {details.imdbRating}</span>
                )}
                {details.totalSeasons && (
                  <span className="chip">
                    {details.totalSeasons}{' '}
                    {details.totalSeasons === '1' ? 'season' : 'seasons'}
                  </span>
                )}
              </div>

              <p className="modal-plot">{details.Plot !== 'N/A' ? details.Plot : 'No plot available.'}</p>

              <dl className="stats">
                <Stat label="Genre" value={details.Genre} />
                <Stat label="Director" value={details.Director} />
                <Stat label="Cast" value={details.Actors} />
                <Stat label="Released" value={details.Released} />
                <Stat label="Language" value={details.Language} />
                <Stat label="Country" value={details.Country} />
              </dl>

              {ratings.length > 0 && (
                <ul className="ratings">
                  {ratings.map((rating) => (
                    <li key={rating.Source}>
                      <span>{rating.Source}</span>
                      <strong>{rating.Value}</strong>
                    </li>
                  ))}
                </ul>
              )}

              <a
                className="imdb-link"
                href={`https://www.imdb.com/title/${imdbID}/`}
                target="_blank"
                rel="noreferrer"
              >
                View on IMDb →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
