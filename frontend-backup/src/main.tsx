import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './assets/styles/globals.css'
import './styles/animations.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

const basename = import.meta.env.BASE_URL || '/'
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found')
} else {
  ReactDOM.createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={basename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </QueryClientProvider>,
  )
}

