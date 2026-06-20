export default function Home() {
  return (
    <>
      <style>{`html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }`}</style>
      <iframe
        src="/studlin.html"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
        title="Studlin"
      />
    </>
  )
}
