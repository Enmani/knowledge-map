import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConceptIconLab } from './features/concept-icons'
import './styles.css'

const searchParams = new URLSearchParams(window.location.search)
const RootView = searchParams.get('demo') === 'concept-icons' ? ConceptIconLab : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootView />
  </React.StrictMode>,
)
