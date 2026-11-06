import { useState } from 'react'
import type { SearchItem } from '../api'

interface Props {
  item: SearchItem
  onSelect: (id: string) => void
}

export default function MovieCard({ item, onSelect }: Props) {
  const [posterFailed, setPosterFailed] = useState(false)
  const hasPoster = item.Poster !== 'N/A' && !posterFailed

  return (
    <button type="button" className="card" onClick={() => onSelect(item.imdbID)}>
      <div className="card-poster">
        {hasPoster ? (
          <img
            src={item.Poster}
            alt={`${item.Title} poster`}
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <span className="card-poster-fallback" aria-hidden="true">
            {item.Title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="card-body">
        <p className="card-title">{item.Title}</p>
        <p className="card-meta">
          {item.Year}
          <span aria-hidden="true"> · </span>
          <span className="card-type">{item.Type}</span>
        </p>
      </div>
    </button>
  )
}
