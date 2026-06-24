import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import EventPage from './pages/EventPage.jsx'
import BlogIndex from './pages/BlogIndex.jsx'
import BlogPost from './pages/BlogPost.jsx'
import AdminPage from './pages/AdminPage.jsx'
import MatchesPage from './pages/MatchesPage.jsx'
import HelpCenterPage from './pages/HelpCenterPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import { SECTIONS } from './config/sections.js'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogIndex />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/matches" element={<MatchesPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      {SECTIONS.map((s) => (
        <Route key={s.slug} path={`/${s.slug}`} element={<CategoryPage section={s} />} />
      ))}
      <Route path="/:slug" element={<EventPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
