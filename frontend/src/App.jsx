import SearchPage from './pages/SearchPage'
import { SearchStatsProvider } from './context/SearchStatsContext'

function App() {
  return (
    <SearchStatsProvider>
      <div className="min-h-screen flex flex-col">
        <SearchPage />
      </div>
    </SearchStatsProvider>
  )
}

export default App
