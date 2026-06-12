import { redirect } from 'next/navigation'

// The library is now the home page. Keep this route as a redirect so any
// existing /library links land in the right place.
export default function LibraryPage() {
  redirect('/')
}
